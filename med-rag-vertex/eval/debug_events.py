"""Debug helper: run one question through the agent and dump every event."""

import asyncio
import sys

from google.adk.runners import InMemoryRunner
from google.genai import types

from medrag_agent.agent import root_agent

Q = "62세 여성, 우측 유방에 만져지는 멍울, 통증 없음, 유두 분비물 없음. 다음 검사로 무엇을 권해야 하나요?"


async def main() -> None:
    runner = InMemoryRunner(agent=root_agent, app_name="dbg")
    session = await runner.session_service.create_session(app_name="dbg", user_id="u")
    msg = types.Content(role="user", parts=[types.Part(text=Q)])
    async for ev in runner.run_async(user_id="u", session_id=session.id, new_message=msg):
        parts = ev.content.parts if ev.content and ev.content.parts else []
        kinds = []
        for p in parts:
            if p.text:
                kinds.append(f"text[{len(p.text)}]")
            if p.function_call:
                kinds.append(f"call:{p.function_call.name}")
            if p.function_response:
                kinds.append(f"resp:{p.function_response.name}")
        print(f"author={ev.author} final={ev.is_final_response()} "
              f"finish={getattr(ev, 'finish_reason', None)} parts={kinds}",
              flush=True)
        if ev.error_code or ev.error_message:
            print("  ERROR:", ev.error_code, ev.error_message, flush=True)
    print("done", flush=True)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    asyncio.run(main())
