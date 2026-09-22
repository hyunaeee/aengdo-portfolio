from __future__ import annotations

import argparse
import hashlib
import json
import platform
from datetime import datetime, timezone
from pathlib import Path

from .planner import parse_instruction, plan_with_ollama


def main():
    parser = argparse.ArgumentParser(description="RoboSkill Lab · MuJoCo tabletop pushing")
    commands = parser.add_subparsers(dest="command", required=True)
    bench = commands.add_parser("benchmark", help="Paired control benchmark (no LLM required)")
    bench.add_argument("--out", type=Path, default=Path("artifacts/latest"))
    bench.add_argument("--seeds", type=int, default=3)
    run = commands.add_parser("run", help="Execute a constrained instruction")
    run.add_argument("--instruction", default="빨간 블록을 오른쪽 목표로 밀어줘")
    run.add_argument("--policy", choices=["open_loop", "closed_loop"], default="closed_loop")
    run.add_argument("--scenario", choices=["nominal", "slippery", "heavy", "disturbance"], default="disturbance")
    run.add_argument("--seed", type=int, default=0)
    run.add_argument("--out", type=Path, default=Path("artifacts/single-run"))
    run.add_argument("--ollama-model", help="Opt-in: use an already installed local Ollama model")
    run.add_argument("--render", action="store_true", help="Save an actual MuJoCo screenshot (requires OpenGL)")
    args = parser.parse_args()
    if args.command == "benchmark" and not 1 <= args.seeds <= 100:
        parser.error("--seeds must be between 1 and 100")
    if args.out.exists():
        parser.error(f"Output already exists: {args.out}. Use a new --out directory to preserve evidence.")
    task = None
    if args.command == "run":
        try:
            task = plan_with_ollama(args.instruction, args.ollama_model) if args.ollama_model else parse_instruction(args.instruction)
        except ValueError as exc:
            parser.error(str(exc))
    import mujoco
    import numpy as np
    from .simulation import PushExperiment, SCENARIOS, SUCCESS_RADIUS, MAX_SIM_TIME

    episodes = []
    if args.command == "benchmark":
        for scenario in SCENARIOS:
            for seed in range(args.seeds):
                task = parse_instruction("빨간 블록을 오른쪽 목표로 밀어줘" if seed % 2 == 0 else "파란 블록을 왼쪽 목표로 밀어줘")
                for policy in ("open_loop", "closed_loop"):
                    episode = PushExperiment(task, scenario, seed).run(policy)
                    episodes.append(episode)
                    print(f"{episode['id']}: success={episode['success']} distance={episode['final_distance_m']:.3f}m", flush=True)
    else:
        experiment = PushExperiment(task, args.scenario, args.seed)
        episodes.append(experiment.run(args.policy))
    args.out.mkdir(parents=True)
    report = {
        "schema_version": 1, "project": "RoboSkill Lab",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "engine": {"name": "MuJoCo", "version": mujoco.__version__, "timestep_s": 0.002},
        "runtime": {"python": platform.python_version(), "numpy": np.__version__, "platform": platform.platform()},
        "planner": {"name": task.planner, "llm_executed": task.planner == "ollama", "model": getattr(args, "ollama_model", None)},
        "observation": "simulator-state", "episodes": episodes,
        "protocol": {"success_radius_m": SUCCESS_RADIUS, "settled_speed_m_s": 0.025, "settled_angular_speed_rad_s": 0.5, "stable_duration_s": 0.3, "distractor_max_displacement_m": 0.04, "max_sim_time_s": MAX_SIM_TIME, "paired_seeds": True, "wall_time_scope": "model creation, initialization and control; excludes planning, imports, rendering and report writing"},
        "source_sha256": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(Path(__file__).parent.glob("*")) if p.is_file()},
        "limitations": [
            "관측은 시뮬레이터의 실제 좌표입니다. 카메라 인식·VLM은 아직 연결하지 않았습니다.",
            "기본 지시 해석과 제어는 규칙 기반입니다. 학습된 정책·강화학습·VLA 성능을 뜻하지 않습니다.",
            "3축 직교 로봇의 블록 밀기 과제입니다. 6축 로봇팔·집기·실물 로봇 검증은 포함하지 않습니다.",
            "고정된 소규모 개발 시나리오이며 제어기 개발에도 사용했습니다. 독립 테스트셋·현실 일반화를 증명하지 않습니다.",
            "두 전략은 관측 주기뿐 아니라 밀기 거리와 재접근 횟수도 다릅니다. 관측만의 효과를 분리한 실험이 아닙니다.",
            "비표적 블록의 4 cm 미만 이동은 허용합니다. 성공이 무충돌을 뜻하지 않으며 접촉 횟수도 별도로 기록합니다.",
            "2D 뷰어는 저장된 MuJoCo 궤적을 재생합니다. 브라우저 안에서 물리 계산을 수행하지 않습니다.",
        ],
    }
    (args.out / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = ["# RoboSkill Lab · 실제 MuJoCo 실행 결과", "", f"생성: {report['generated_at']}", "", "| Policy | Success | Mean final distance | Mean simulation time |", "|---|---:|---:|---:|"]
    for policy in ("open_loop", "closed_loop"):
        rows = [e for e in episodes if e["policy"] == policy]
        if rows:
            lines.append(f"| {policy} | {sum(e['success'] for e in rows)}/{len(rows)} | {np.mean([e['final_distance_m'] for e in rows]):.4f} m | {np.mean([e['sim_time_s'] for e in rows]):.2f} s |")
    lines.extend(["", "개발용 시나리오의 관측값입니다. 표본이 작으며 제어 방식 간 실행 시간도 다릅니다.", "", *[f"- {s}" for s in report["limitations"]]])
    (args.out / "SUMMARY.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    if args.command == "run" and args.render:
        experiment.render(args.out / "mujoco.png")
        experiment.render_replay(args.out / "replay.gif")
    print(f"Saved {len(episodes)} episodes: {args.out / 'report.json'}")


if __name__ == "__main__":
    main()
