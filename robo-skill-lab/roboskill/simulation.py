"""Real MuJoCo contacts; Cartesian robot control with an oracle-state baseline.

The controller only writes position-actuator targets. Objects are initialized
once, then moved by rigid-body dynamics, including an explicit force disturbance.
"""
from __future__ import annotations

import time
from pathlib import Path

import mujoco
import numpy as np

from .planner import TaskSpec

SCENE = Path(__file__).with_name("scene.xml")
SCENARIOS = {
    "nominal": {"friction": 0.5, "mass": 0.08, "disturbance": False},
    "slippery": {"friction": 0.12, "mass": 0.08, "disturbance": False},
    "heavy": {"friction": 0.7, "mass": 0.18, "disturbance": False},
    "disturbance": {"friction": 0.5, "mass": 0.08, "disturbance": True},
}
SUCCESS_RADIUS = 0.045
MAX_SIM_TIME = 24.0


class PushExperiment:
    def __init__(self, task: TaskSpec, scenario: str = "nominal", seed: int = 0):
        self.started = time.perf_counter()
        if scenario not in SCENARIOS:
            raise ValueError(f"Unknown scenario: {scenario}")
        self.task, self.scenario, self.seed = task, scenario, seed
        self.parameters = SCENARIOS[scenario].copy()
        self.model = mujoco.MjModel.from_xml_path(str(SCENE))
        self.data = mujoco.MjData(self.model)
        self.goal = np.array(task.goal_xy, dtype=float)
        self.model.site("goal").pos[:2] = self.goal
        self.target_id = self.model.body(task.object_name).id
        self.target_geom = self.model.geom(task.object_name.replace("_block", "_geom")).id
        self.tool_geom = self.model.geom("tool").id
        self.other_name = "blue_block" if task.object_name == "red_block" else "red_block"
        self.other_geom = self.model.geom(self.other_name.replace("_block", "_geom")).id
        rng = np.random.default_rng(seed)
        self.data.qpos[:3] = [0.0, -0.32, 0.16]
        self.data.ctrl[:] = self.data.qpos[:3]
        for name in ("red_block", "blue_block"):
            joint = self.model.joint(name.replace("_block", "_joint"))
            address = joint.qposadr[0]
            self.data.qpos[address:address + 2] += rng.uniform(-0.025, 0.025, 2)
            body = self.model.body(name)
            scale = self.parameters["mass"] / float(body.mass[0])
            body.mass[:] *= scale
            body.inertia[:] *= scale
            self.model.geom(name.replace("_block", "_geom")).friction[0] = self.parameters["friction"]
        self.model.geom("floor").friction[0] = self.parameters["friction"]
        initial_qpos = self.data.qpos.copy()
        mujoco.mj_setConst(self.model, self.data)
        self.data.qpos[:] = initial_qpos
        mujoco.mj_forward(self.model, self.data)
        self.initial_pos = self.object_position().copy()
        self.other_initial = self.data.body(self.other_name).xpos.copy()
        self.trajectory, self.events = [], []
        self.contact_steps = self.unintended_contact_steps = self.replans = 0
        self.peak_contact_force = 0.0
        self.disturbance_start = None
        self.phase = "settle"
        self.steps = 0
        self.workspace_violation = False
        self.stable_since = None
        self._advance(0.3)

    def object_position(self):
        return self.data.body(self.task.object_name).xpos[:2].copy()

    def event(self, kind, message):
        self.events.append({"t": round(float(self.data.time), 4), "type": kind, "message": message})

    def _step(self):
        if self.data.time >= MAX_SIM_TIME:
            return False
        if (self.parameters["disturbance"] and self.disturbance_start is None
                and self.phase == "push" and np.linalg.norm(self.object_position() - self.initial_pos) > 0.07):
            self.disturbance_start = float(self.data.time)
            self.event("disturbance", "블록에 x 방향 1.2 N 외력을 0.10초 적용")
        self.data.xfrc_applied[self.target_id, :] = 0
        if self.disturbance_start is not None and self.data.time - self.disturbance_start < 0.10:
            self.data.xfrc_applied[self.target_id, 0] = 1.2
        mujoco.mj_step(self.model, self.data)
        if not np.isfinite(self.data.qpos).all():
            raise RuntimeError("MuJoCo state became nonfinite")
        self.steps += 1
        dof = self.model.joint(self.task.object_name.replace("_block", "_joint")).dofadr[0]
        velocity = self.data.qvel[dof:dof + 6]
        stable = (np.linalg.norm(self.object_position() - self.goal) < SUCCESS_RADIUS
                  and np.linalg.norm(velocity[:3]) < 0.025
                  and np.linalg.norm(velocity[3:]) < 0.5)
        if stable:
            if self.stable_since is None:
                self.stable_since = float(self.data.time)
        else:
            self.stable_since = None
        touched, unintended = False, False
        for i in range(self.data.ncon):
            contact = self.data.contact[i]
            pair = {int(contact.geom1), int(contact.geom2)}
            if pair == {self.tool_geom, self.target_geom}:
                touched = True
                force = np.zeros(6)
                mujoco.mj_contactForce(self.model, self.data, i, force)
                self.peak_contact_force = max(self.peak_contact_force, float(np.linalg.norm(force[:3])))
            if self.other_geom in pair and (self.tool_geom in pair or self.target_geom in pair):
                unintended = True
        self.contact_steps += int(touched)
        self.unintended_contact_steps += int(unintended)
        if any(np.max(np.abs(self.data.body(n).xpos[:2])) > 0.43 for n in ("red_block", "blue_block")):
            if not self.workspace_violation:
                self.event("workspace_violation", "블록이 작업 영역을 벗어남")
            self.workspace_violation = True
        if self.steps % 25 == 0:
            self.capture()
        return not self.workspace_violation

    def capture(self):
        self.trajectory.append({
            "t": round(float(self.data.time), 4),
            "tool": self.data.body("carriage").xpos.round(5).tolist(),
            "objects": {name: self.data.body(name).xpos.round(5).tolist() for name in ("red_block", "blue_block")},
            "goal": self.goal.tolist(), "phase": self.phase,
            "qpos": self.data.qpos.round(8).tolist(),
        })

    def _advance(self, duration):
        for _ in range(int(round(duration / self.model.opt.timestep))):
            if not self._step():
                break

    def move(self, xyz, speed=0.28):
        destination = np.asarray(xyz, dtype=float)
        if np.any(np.abs(destination[:2]) > 0.415) or not 0.032 <= destination[2] <= 0.22:
            self.event("unreachable", "계획한 툴 위치가 로봇 이동 한계를 벗어남")
            return False
        start = self.data.ctrl.copy()
        duration = max(float(np.linalg.norm(destination - start)) / speed, 0.15)
        count = int(np.ceil(duration / self.model.opt.timestep))
        for step in range(1, count + 1):
            self.data.ctrl[:] = start + (destination - start) * step / count
            if not self._step():
                return False
        self._advance(0.10)
        return True

    def run(self, policy="closed_loop"):
        if policy not in ("open_loop", "closed_loop"):
            raise ValueError("policy must be open_loop or closed_loop")
        self.event("start", f"{policy}: {self.task.instruction}")
        # Both policies see exactly the same initial state and use the same
        # actuator, speed, thresholds and physical time limit.
        for cycle in range(12 if policy == "closed_loop" else 1):
            position = self.object_position()
            delta = self.goal - position
            distance = float(np.linalg.norm(delta))
            if distance <= 0.028:
                break
            if cycle:
                self.replans += 1
                self.event("replan", f"위치를 다시 관찰해 경로 수정 · 목표 거리 {distance:.3f} m")
            direction = delta / distance
            # Rotated square support function, to contact the center of its
            # rear face rather than penetrate the block with the tool.
            rotation = self.data.body(self.task.object_name).xmat.reshape(3, 3)
            support = 0.025 * np.sum(np.abs(rotation[:2, :2].T @ direction))
            offset = support + 0.018
            behind = position - direction * (offset + 0.025)
            self.phase = "lift"
            if not self.move([*self.data.ctrl[:2], 0.16]):
                break
            self.phase = "approach"
            if not self.move([*behind, 0.16]):
                break
            self.phase = "lower"
            if not self.move([*behind, 0.038], speed=0.20):
                break
            self.phase = "push"
            progress = distance if policy == "open_loop" else min(distance, 0.095)
            target = position + direction * (progress - offset)
            if not self.move([*target, 0.038], speed=0.16):
                break
            self.phase = "lift"
            if not self.move([*self.data.ctrl[:2], 0.16], speed=0.22):
                break
            self.phase = "observe"
            self._advance(0.20)
        self.phase = "settle"
        self._advance(0.65)
        self.capture()
        distance = float(np.linalg.norm(self.goal - self.object_position()))
        settled = bool(self.stable_since is not None and self.data.time - self.stable_since >= 0.3)
        timed_out = bool(self.data.time >= MAX_SIM_TIME)
        distractor_displacement = float(np.linalg.norm(self.data.body(self.other_name).xpos[:2] - self.other_initial[:2]))
        success = bool(distance < SUCCESS_RADIUS and settled and not timed_out and not self.workspace_violation and distractor_displacement < 0.04)
        self.event("success" if success else "failure", f"최종 거리 {distance:.4f} m · 정지 상태 {settled}")
        return {
            "id": f"{self.scenario}-{self.seed}-{policy}", "policy": policy,
            "scenario": self.scenario, "seed": self.seed,
            "task": {"object_name": self.task.object_name, "goal": self.task.goal, "instruction": self.task.instruction},
            "parameters": self.parameters, "success": success,
            "final_distance_m": distance, "settled": settled,
            "sim_time_s": float(self.data.time), "wall_time_s": time.perf_counter() - self.started,
            "timed_out": timed_out,
            "termination_reason": "success" if success else "timeout" if timed_out else "workspace_violation" if self.workspace_violation else "goal_not_stable",
            "contact_steps": self.contact_steps, "peak_contact_point_force_n": self.peak_contact_force,
            "unintended_contact_steps": self.unintended_contact_steps,
            "distractor_displacement_m": distractor_displacement,
            "workspace_violation": self.workspace_violation, "replans": self.replans,
            "disturbance_applied": self.disturbance_start is not None,
            "trajectory": self.trajectory, "events": self.events,
        }

    def render(self, path, width=960, height=720):
        from PIL import Image
        with mujoco.Renderer(self.model, height=height, width=width) as renderer:
            renderer.update_scene(self.data, camera="overview")
            Image.fromarray(renderer.render()).save(path)

    def render_replay(self, path, stride=4):
        """Render the recorded joint states with MuJoCo, preserving sim timing."""
        from PIL import Image
        replay = mujoco.MjData(self.model)
        frames = []
        selected = self.trajectory[::stride]
        if selected[-1] is not self.trajectory[-1]:
            selected.append(self.trajectory[-1])
        with mujoco.Renderer(self.model, height=480, width=640) as renderer:
            for state in selected:
                replay.qpos[:] = state["qpos"]
                mujoco.mj_forward(self.model, replay)
                renderer.update_scene(replay, camera="overview")
                frames.append(Image.fromarray(renderer.render()).quantize(colors=96))
        durations = [max(20, int(round((b["t"] - a["t"]) * 1000))) for a, b in zip(selected, selected[1:])]
        durations.append(500)
        frames[0].save(path, save_all=True, append_images=frames[1:], duration=durations, loop=0)
