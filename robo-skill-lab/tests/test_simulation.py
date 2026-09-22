"""Physical invariants checked against real MuJoCo dynamics, without rendering."""

import unittest
from unittest.mock import patch

import mujoco
import numpy as np

from roboskill.planner import TaskSpec
from roboskill.simulation import MAX_SIM_TIME, PushExperiment, SUCCESS_RADIUS


class SimulationTests(unittest.TestCase):
    def task(self, object_name="red_block", goal="right"):
        return TaskSpec(object_name=object_name, goal=goal, instruction="simulation test")

    def test_seed_initialization_is_reproducible_and_varies_after_model_constants(self):
        first = PushExperiment(self.task(), scenario="heavy", seed=19)
        repeat = PushExperiment(self.task(), scenario="heavy", seed=19)
        different = PushExperiment(self.task(), scenario="heavy", seed=20)
        np.testing.assert_array_equal(first.initial_pos, repeat.initial_pos)
        np.testing.assert_array_equal(first.data.qpos, repeat.data.qpos)
        self.assertGreater(np.linalg.norm(first.initial_pos - different.initial_pos), 0.001)
        self.assertGreater(np.linalg.norm(first.other_initial - different.other_initial), 0.001)
        # mj_setConst must not silently discard the sampled state or mass changes.
        np.testing.assert_allclose(first.object_position(), first.initial_pos, atol=1e-8)
        for body_name in ("red_block", "blue_block"):
            self.assertAlmostEqual(float(first.model.body(body_name).mass[0]), 0.18)
            self.assertTrue(np.all(first.model.body(body_name).inertia > 0))
        self.assertAlmostEqual(float(first.model.geom("floor").friction[0]), 0.7)

    def test_position_controls_produce_contact_and_move_only_the_selected_block(self):
        experiment = PushExperiment(self.task(), seed=0)
        initial_ctrl = experiment.data.ctrl.copy()
        result = experiment.run("closed_loop")
        self.assertTrue(result["success"], result)
        self.assertLess(result["final_distance_m"], SUCCESS_RADIUS)
        self.assertGreater(result["contact_steps"], 0)
        self.assertGreater(result["peak_contact_point_force_n"], 0.01)
        self.assertGreater(np.linalg.norm(experiment.object_position() - experiment.initial_pos), 0.2)
        self.assertGreater(np.linalg.norm(experiment.data.ctrl - initial_ctrl), 0.1)
        self.assertEqual(result["unintended_contact_steps"], 0)
        self.assertLess(result["distractor_displacement_m"], 0.001)
        self.assertTrue(np.isfinite(experiment.data.qpos).all())

    def test_no_control_settling_does_not_move_a_block_toward_the_goal(self):
        experiment = PushExperiment(self.task("blue_block", "left"), seed=4)
        start = experiment.object_position()
        initial_distance = np.linalg.norm(experiment.goal - start)
        experiment._advance(3.0)  # Hold the tool clear; only gravity/contact settling acts.
        np.testing.assert_allclose(experiment.object_position(), start, atol=1e-7)
        final_distance = np.linalg.norm(experiment.goal - experiment.object_position())
        self.assertAlmostEqual(float(final_distance), float(initial_distance), places=7)
        self.assertEqual(experiment.contact_steps, 0)
        self.assertEqual(experiment.unintended_contact_steps, 0)

    def test_disturbance_event_has_an_actual_bounded_force_in_the_physics_state(self):
        experiment = PushExperiment(self.task(), scenario="disturbance", seed=0)
        applied = []
        original_step = experiment._step
        dof = int(experiment.model.joint("red_joint").dofadr[0])

        def observe_physics_step():
            continued = original_step()
            force = experiment.data.xfrc_applied[experiment.target_id].copy()
            if force[0] != 0:
                applied.append((float(experiment.data.time), force, experiment.data.qvel[dof:dof + 3].copy()))
            return continued

        with patch.object(experiment, "_step", side_effect=observe_physics_step):
            result = experiment.run("closed_loop")
        self.assertTrue(result["disturbance_applied"])
        self.assertEqual(sum(event["type"] == "disturbance" for event in result["events"]), 1)
        self.assertGreater(len(applied), 1)
        for _, force, _ in applied:
            np.testing.assert_allclose(force, [1.2, 0, 0, 0, 0, 0])
        self.assertLessEqual(applied[-1][0] - applied[0][0], 0.102)
        self.assertGreater(applied[-1][0] - applied[0][0], 0.09)
        self.assertGreater(max(np.linalg.norm(velocity) for _, _, velocity in applied), 0.01)
        np.testing.assert_array_equal(experiment.data.xfrc_applied[experiment.target_id], np.zeros(6))

    def test_paired_policies_repeat_deterministically_except_wall_clock_time(self):
        starts = []
        for policy in ("open_loop", "closed_loop"):
            with self.subTest(policy=policy):
                first = PushExperiment(self.task(), scenario="slippery", seed=11)
                repeat = PushExperiment(self.task(), scenario="slippery", seed=11)
                starts.append(first.data.qpos.copy())
                first_result = first.run(policy)
                repeat_result = repeat.run(policy)
                first_result.pop("wall_time_s")
                repeat_result.pop("wall_time_s")
                self.assertEqual(first_result, repeat_result)
                np.testing.assert_array_equal(first.data.qpos, repeat.data.qpos)
                np.testing.assert_array_equal(first.data.qvel, repeat.data.qvel)
        np.testing.assert_array_equal(starts[0], starts[1])

    def test_invalid_scenario_policy_or_unreachable_move_fails_before_motion(self):
        with self.assertRaisesRegex(ValueError, "Unknown scenario"):
            PushExperiment(self.task(), scenario="teleport")
        experiment = PushExperiment(self.task(), seed=0)
        before = experiment.data.qpos.copy()
        before_time = experiment.data.time
        with self.assertRaisesRegex(ValueError, "policy"):
            experiment.run("generated_python")
        self.assertFalse(experiment.move([1.0, 0.0, 0.16]))
        np.testing.assert_array_equal(experiment.data.qpos, before)
        self.assertEqual(experiment.data.time, before_time)
        self.assertEqual(experiment.events[-1]["type"], "unreachable")
        self.assertIsInstance(experiment.model, mujoco.MjModel)

    def test_goal_reached_too_late_to_complete_stable_dwell_is_a_timeout(self):
        experiment = PushExperiment(self.task(), seed=0)
        # Fixture setup: arrive at the goal with only 0.10 s of the budget left.
        address = int(experiment.model.joint("red_joint").qposadr[0])
        experiment.data.qpos[address:address + 2] = experiment.goal
        experiment.data.qvel[:] = 0
        experiment.data.time = MAX_SIM_TIME - 0.10
        experiment.stable_since = None
        mujoco.mj_forward(experiment.model, experiment.data)

        result = experiment.run("closed_loop")

        self.assertLess(result["final_distance_m"], SUCCESS_RADIUS)
        self.assertFalse(result["settled"])
        self.assertFalse(result["success"])
        self.assertTrue(result["timed_out"])
        self.assertEqual(result["termination_reason"], "timeout")
        self.assertGreaterEqual(result["sim_time_s"], MAX_SIM_TIME)


if __name__ == "__main__":
    unittest.main()
