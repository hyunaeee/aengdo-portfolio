# Local execution evidence — 2026-10-13

- 범위: 독립 실험 코드. 기존 제품의 과금 구현이나 기업 운영 성과가 아닙니다.
- 환경: Windows 호스트 Node.js 24.18.0, Prisma 6.19.0, Docker Linux PostgreSQL 16.15.
- 이미지: `postgres:16-alpine`, 실행 시 digest `sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea`.
- DB: 임시 loopback 컨테이너, 전용 `timely_ledger_lab`. 실사용 DB·외부 API·결제사를 사용하지 않았습니다.
- `prisma migrate deploy`: 2개 migration 적용 성공.
- `prisma migrate diff --from-url ... --to-schema-datamodel prisma/schema.prisma --exit-code`: 차이 없음.
- TypeScript 검사 통과. 실제 PostgreSQL 통합 테스트 **8개 통과 / 0개 실패 / 0개 생략**. [전체 테스트 출력](integration-test.txt).

| 최신 20건 조회 | 인덱스 추가 전 | 인덱스 추가 후 |
|---|---|---|
| 계획 | Bitmap Heap Scan + top-N Sort | Index Scan |
| 하위 scan의 실제 행 수 | 5,000 | 20 |
| query root shared blocks (hit + read) | 1,240 | 8 |
| 단일 실행 시간 | 2.079 ms | 0.036 ms |

합성 원장 100,000개, tenant 20개, tenant당 5,000개로 측정했습니다. 테스트 행은 별도 무작위 tenant에 남아 있습니다. [EXPLAIN 원본](explain.json)은 버전·측정 시각·전체 계획을 포함합니다. 인덱스 생성과 실행 순서에 따른 캐시 효과가 있으며 반복 부하 시험이 아닙니다. 시간 수치는 재현마다 달라집니다. 결과는 인덱스 선택과 scan/sort 감소를 보여주는 실험 자료입니다.

검증 후 이 작업에서 생성한 전용 컨테이너의 ID와 task label을 확인하고 해당 컨테이너를 제거했습니다. GitHub Actions 구성은 준비했으며 이 로컬 보고서만으로 원격 CI가 성공했다고 주장하지 않습니다.
