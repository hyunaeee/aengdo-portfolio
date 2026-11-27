# GR00T N1.6 가상 로봇 실험

RoboCasa 주방에서 Fourier GR1이 병을 집어 캐비닛에 넣고 문을 닫는 과제다. 시뮬레이터가 만든 머리 카메라 영상, 팔·손·허리 관절 상태와 과제 지시문을 NVIDIA의 공개 `GR00T-N1.6-3B`에 보낸다. 매번 모델이 예측한 16스텝 중 처음 8스텝을 실행하고, 달라진 장면에서 다시 추론한다. 이 실험의 모델 버전은 N1.6이다. [NVIDIA 체크포인트](https://huggingface.co/nvidia/GR00T-N1.6-3B) · [공식 과제와 평가 설정](https://github.com/NVIDIA/Isaac-GR00T/blob/5dc80c4afd726b34faad1d8f7e007a13b34e4c88/examples/robocasa-gr1-tabletop-tasks/README.md)

## 실행

Windows에서는 GPU가 연결된 Docker Desktop의 WSL2 Linux 엔진을 사용한다. Linux VM에서는 Docker 컨테이너 안에서 NVIDIA GPU를 볼 수 있어야 한다. 아래 명령은 이 README가 있는 `gr00t-vm` 폴더에서 실행한다.

```sh
docker compose build
docker compose run --rm sim
```

첫 실행은 모델 가중치와 주방·물체 에셋을 전용 Docker 볼륨에 받는다. 이 PC에서 두 볼륨이 사용한 공간은 각각 약 6.2GiB와 8.0GiB였다. Docker 이미지와 빌드 캐시 공간은 별도로 든다. 다음 실행은 설치한 파일을 재사용한다. 모델은 GPU를 쓰고, MuJoCo는 Linux 컨테이너에서 CPU로 물리 계산과 카메라 렌더링을 수행한다. 한 에피소드의 기본 한도는 720스텝이다.

짧은 연결 테스트는 `docker compose run --rm sim --max-steps 16`으로 두 번의 추론까지 확인할 수 있다. 아래 명령은 다른 과제와 초기 배치를 고른다. 과제 이름을 바꾸면 시뮬레이터가 지시문과 성공 판정을 함께 바꾼다.

```sh
docker compose run --rm sim --task PnPCanToDrawerClose --seed 7
```

실험을 마쳤을 때 아래 명령으로 모델 서버를 내리면 GPU 메모리가 반환된다. 가중치와 에셋은 다음 실험에 쓸 수 있다.

```sh
docker compose down
```

## 결과 읽기

실행마다 `results/` 아래에 새 폴더가 생긴다.

| 파일 | 확인할 내용 |
|---|---|
| `episode.mp4` | 초기 배치부터 마지막 스텝까지 실제 시뮬레이터의 머리 카메라 영상 |
| `result.json` | 과제의 실제 지시문, 시뮬레이터 시드, 실행 스텝, 모델 호출 횟수, 성공 여부와 종료 이유 |
| `actions.jsonl` | 호출별 카메라 입력 해시, 요청 왕복 시간, 실제 적용한 양팔·양손·허리 관절 명령 |

`success`는 RoboCasa가 해당 스텝에서 반환한 성공 판정을 뜻한다. `step_limit`은 설정한 스텝 수를 다 썼다는 뜻이다. 시드는 시뮬레이터의 초기 조건에 적용한다. 모델이 행동을 샘플링하므로 같은 시드에서도 다른 궤적이 나올 수 있다.

## 이 PC에서 확인한 결과

2026년 11월 25일, RTX 4090에서 각 과제를 한 번씩 실행했다.

| 과제 | 시드 | 추론 호출 | 제어 스텝 | 롤아웃 시간 | 종료 결과 |
|---|---:|---:|---:|---:|---|
| 생수병을 캐비닛에 넣고 문 닫기 | 42 | 31 | 247 | 43.03초 | 성공 |
| 캔을 서랍에 넣고 서랍 닫기 | 7 | 90 | 720 | 119.25초 | 스텝 한도 도달 |

GPU를 다른 작업과 공유하던 중 최초 시연 입력의 추론 요청이 180초를 넘겼다. 이 실험의 정책 서버만 재시작한 뒤 실제 응답을 확인하고 두 에피소드를 실행했다. 첫 응답에서 멈춘 경우 `docker compose logs policy`로 가중치 로드 여부를 확인하고, GPU 여유가 생기면 `docker compose restart policy` 후 에피소드를 다시 실행할 수 있다.
