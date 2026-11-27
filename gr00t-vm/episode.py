"""Run one real GR00T N1.6 policy against a new simulated Fourier GR1 episode."""

import argparse
from contextlib import ExitStack
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import time
from uuid import uuid4

import av
import gymnasium as gym
import msgpack
import numpy as np
import robocasa.utils.gym_utils.gymnasium_groot  # registers gr1_unified tasks
import zmq


DEFAULT_TASK = "PnPBottleToCabinetClose"
MODEL = "nvidia/GR00T-N1.6-3B"


def encode_array(value):
    # Match the public N1.6 PolicyServer wire protocol without importing PyTorch in the simulator.
    if not isinstance(value, np.ndarray):
        raise TypeError(f"Cannot encode {type(value)}")
    buffer = io.BytesIO()
    np.save(buffer, value, allow_pickle=False)
    return {"__ndarray_class__": True, "as_npy": buffer.getvalue()}


def decode_array(value):
    if "__ndarray_class__" in value:
        return np.load(io.BytesIO(value["as_npy"]), allow_pickle=False)
    return value


def request(socket, endpoint, data=None):
    socket.send(msgpack.packb({"endpoint": endpoint, "data": data or {}}, default=encode_array))
    response = msgpack.unpackb(socket.recv(), object_hook=decode_array)
    if isinstance(response, dict) and "error" in response:
        raise RuntimeError(response["error"])
    return response


def policy_input(observation):
    # GR1 uses one environment and the latest observation (batch=1, history=1).
    return {
        key: [value] if isinstance(value, str) else value[None, None, ...]
        for key, value in observation.items()
    }


def record_frame(container, stream, rgb):
    frame = av.VideoFrame.from_ndarray(rgb, format="rgb24")
    for packet in stream.encode(frame):
        container.mux(packet)


def run(args):
    env_id = f"gr1_unified/{args.task}_GR1ArmsAndWaistFourierHands_Env"
    now = datetime.now(timezone.utc)
    out = args.output / f"{now:%Y%m%dT%H%M%SZ}-{uuid4().hex[:8]}"
    out.mkdir(parents=True)
    with ExitStack() as stack:
        context = stack.enter_context(zmq.Context())
        socket = stack.enter_context(context.socket(zmq.REQ))
        socket.linger = 0
        socket.rcvtimeo = 180_000
        socket.sndtimeo = 30_000
        socket.connect(f"tcp://{args.host}:5555")
        if request(socket, "ping").get("status") != "ok":
            raise RuntimeError("Policy server did not answer ping.")
        env = gym.make(env_id, seed=args.seed, enable_render=True, disable_env_checker=True)
        stack.callback(env.close)
        obs, _ = env.reset(seed=args.seed)
        request(socket, "reset", {"options": {}})
        instruction = obs["annotation.human.coarse_action"]
        print(f"Task: {instruction}\nRecording in {out}", flush=True)
        video = stack.enter_context(av.open(str(out / "episode.mp4"), "w"))
        stream = video.add_stream("libx264", rate=20)
        stream.width, stream.height = 640, 400
        stream.pix_fmt = "yuv420p"
        stream.options = {"crf": "23", "preset": "veryfast"}
        record_frame(video, stream, env.unwrapped.render())
        log = stack.enter_context((out / "actions.jsonl").open("w", encoding="utf-8"))
        started = time.perf_counter()
        steps = calls = 0
        success = False
        reason = "step_limit"
        while steps < args.max_steps:
            camera_digest = hashlib.sha256(
                obs["video.ego_view_bg_crop_pad_res256_freq20"].tobytes()
            ).hexdigest()
            query_time = time.perf_counter()
            actions, _ = request(socket, "get_action", {"observation": policy_input(obs)})
            latency = time.perf_counter() - query_time
            if set(actions) != set(env.action_space.keys()):
                raise ValueError(f"Unexpected action groups from the model: {list(actions)}")
            for name, values in actions.items():
                if (values.ndim != 3 or values.shape[0] != 1 or values.shape[1] < 8
                        or values.shape[2:] != env.action_space[name].shape or not np.isfinite(values).all()):
                    raise ValueError(f"Invalid action chunk for {name}: {values.shape}")
            calls += 1
            chunk = min(8, args.max_steps - steps)
            start_step = steps
            finished = False
            for i in range(chunk):
                obs, _, terminated, truncated, info = env.step(
                    {name: values[0, i] for name, values in actions.items()}
                )
                steps += 1
                record_frame(video, stream, env.unwrapped.render())
                success = bool(info["success"])
                if success or terminated or truncated:
                    reason = "success" if success else "environment_ended"
                    finished = True
                    break
            applied = steps - start_step
            log.write(json.dumps({
                "start_step": start_step, "steps_applied": applied, "rpc_seconds": latency,
                "input_camera_sha256": camera_digest,
                "actions": {key: array[0, :applied].tolist() for key, array in actions.items()},
            }) + "\n")
            log.flush()
            if calls == 1 or calls % 10 == 0:
                print(f"Policy calls {calls}, steps {steps}, last RPC {latency:.2f}s", flush=True)
            if finished:
                break
        for packet in stream.encode():
            video.mux(packet)
        elapsed = time.perf_counter() - started
    result = {
        "model": MODEL, "environment": env_id, "environment_seed": args.seed,
        "instruction": instruction, "started_utc": now.isoformat(), "steps": steps,
        "policy_calls": calls, "max_steps": args.max_steps, "success": success,
        "end_reason": reason, "rollout_wall_seconds": round(elapsed, 2),
    }
    (out / "result.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--task", default=DEFAULT_TASK, help="RoboCasa GR1 tabletop task name")
    parser.add_argument("--seed", type=int, default=42, help="Simulator seed")
    parser.add_argument("--max-steps", type=int, default=720)
    parser.add_argument("--output", type=Path, default=Path("/results"))
    parser.add_argument("--host", default="aengdo-gr00t-policy")
    args = parser.parse_args()
    if args.max_steps < 1:
        parser.error("--max-steps must be positive")
    run(args)
