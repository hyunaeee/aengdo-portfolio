# VisionEye Model Server

VisionEye의 YOLO26n **실제 가중치를 메모리에 올려 HTTP 요청을 처리하는 로컬 CPU 서버**입니다. 별도 모델 서버에서 입력 검증·인증·동시 요청 제한·준비 상태·추론 프로세스 재시작을 실험합니다. 자동화 도구의 도움으로 구현한 개인 검증 프로젝트이며 기업 운영 성과를 뜻하지 않습니다.

GPU의 VisionEye 비교 실험, RTX 4090 회의 어시스턴트, MED-RAG Serving Lab의 합성 응답 검증과 별도입니다. 이 서버는 CUDA를 숨기고 CPU FP32·2개 Torch 스레드로 고정합니다. 기존 환경을 업그레이드하지 않습니다.

## 구조

`인증된 이미지 요청 → 용량 1 admission → 별도 YOLO 프로세스 → 실제 검출 좌표`

- `POST /predict`: JSON `image_base64`, JPEG/PNG, 1 MB·300만 픽셀 이하. 외부 URL이나 로컬 경로를 받지 않습니다.
- `GET /health/live`: HTTP 프로세스 응답 여부.
- `GET /health/ready`: 모델 로드·워밍업 완료 여부, 세대 번호, 모델 SHA256, 실제 장치.
- `GET /metrics`: HTTP 상태별 요청 수, 처리 중 요청 수, 재시작 수, 누적 요청 시간. Prometheus 텍스트 형식이며 실제 Prometheus 수집·경보는 이 실험에 포함하지 않습니다.
- 대기열 없이 한 요청만 추론합니다. 초과는 429, 시작·재로딩 중에는 503입니다.
- deadline 또는 추론 프로세스 종료 시 해당 자식만 정리하고 **새 IPC 연결과 새 프로세스**로 같은 가중치를 로드합니다. 지연된 이전 응답은 재사용하지 않습니다.
- 정상 CLI에는 장애 주입 경로가 없습니다. 검증 harness만 토큰으로 보호된 stall/crash 경로를 켭니다. stall은 인위적인 60초 대기, crash는 자식 프로세스의 실제 종료입니다.
- 모델 SHA256 불일치로 시작을 거부합니다. 재시작 3회가 연속으로 준비 상태에 도달하지 못하면 실패 상태로 남습니다.

## 재현

Python 3.12를 권장합니다. 새 가상환경에 requirements를 설치한 뒤 아래 명령을 **이 폴더에서** 실행합니다. 가중치는 저장소에 포함하지 않습니다.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe download_model.py
.\.venv\Scripts\python.exe rehearsal.py --model models/yolo26n.pt --fixtures fixtures --out artifacts/my-run
```

`artifacts/my-run`은 새 경로여야 합니다. 검증기는 임의의 빈 loopback 포트에 자체 서버를 만들고 종료합니다. 기존 서버 주소를 입력받거나 운영 서비스를 종료하지 않습니다. 모델 추론 20회와 2종 오류·복구 시나리오를 실행합니다. 실행 중에는 다른 성능 실험을 동시에 수행하지 마세요.

지속 실행은 별도로:

```powershell
$env:VISIONEYE_API_TOKEN = python -c "import secrets; print(secrets.token_urlsafe(32))"
.\.venv\Scripts\python.exe server.py --model models/yolo26n.pt --port 18861
```

토큰은 출력·공개하지 마세요. 요청은 `Authorization: Bearer <token>`을 포함합니다. 브라우저 Origin 요청은 거부하고 CORS를 열지 않습니다. Ctrl+C로 정리합니다. 서버는 127.0.0.1에만 바인딩합니다. 인터넷 공개용 TLS·사용자별 권한·역방향 프록시·호스트 복구 체계는 포함하지 않습니다.

모델 없이 실행하는 자동 테스트:

```powershell
python -m unittest discover -s tests -v
```

위 unit test는 scripted worker로 제어 흐름만 검사합니다. 실제 추론 근거는 `rehearsal.py`가 생성한 `summary.json`, `requests.jsonl`, `events.jsonl`, `metrics.prom`입니다. 소스 hash와 원본 요청을 다시 확인하는 `check_evidence.py`로 공개 요약의 변조·오래된 기록을 감지합니다. hash는 외부 인증이나 독립 감사가 아닙니다.

## 측정 범위

- 입력은 공개된 Higgsfield 생성 영상의 3개 프레임입니다. `fixtures/source.json`에 원본과 추출 파일의 SHA256이 있습니다. 실제 고객 영상이 아닙니다.
- 기본 측정은 20개 순차 HTTP 요청입니다. HTTP 시작부터 전체 JSON 응답 수신까지 측정하고 모델 초기화는 별도입니다. p95는 nearest-rank이며 작은 smoke 표본입니다.
- 429는 의도적으로 멈춘 worker에 두 번째 요청을 보낸 결과입니다. 자연 부하에서 처리 용량을 찾는 벤치마크가 아닙니다.
- 재시작은 동일 버전의 **모델 worker** 복구입니다. HTTP 서버·호스트 장애 복구, 다른 모델 버전으로의 롤백은 검증하지 않습니다.
- ByteTrack 세션이나 IN/OUT 집계는 이 HTTP API에 포함하지 않습니다. 독립된 이미지의 사람 검출 API입니다.
- 웹에 배포하는 것은 결과 뷰어입니다. 공개 사이트에서 모델 추론이 계속 실행되는 서비스가 아닙니다.

## 근거와 라이선스

구현은 [Ultralytics predict 문서](https://docs.ultralytics.com/modes/predict/)와 [Python multiprocessing 문서](https://docs.python.org/3/library/multiprocessing.html)를 참고했습니다. Ultralytics/YOLO 가중치에는 해당 [AGPL-3.0 또는 Enterprise 조건](https://www.ultralytics.com/license)이 적용됩니다. 기존 [VisionEye 저장소의 third-party notices](https://github.com/hyunaeee/visioneye-lab/blob/main/THIRD_PARTY_NOTICES.md)를 함께 확인하세요. 생성 영상의 이용 조건은 별도로 적용됩니다.
