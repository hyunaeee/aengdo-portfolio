# PostgreSQL credit ledger lab

**TypeScript + Prisma + 실제 PostgreSQL로 크레딧 정합성·멱등성·쿼리 계획을 검증한 독립 학습 프로젝트입니다.** TableON, Terracotta 또는 회사 서비스에 이 코드를 적용했다는 뜻이 아닙니다. 외부 결제사·실제 돈·고객 데이터는 사용하지 않습니다.

## 구현과 거래 규칙

- tenant마다 지갑 하나를 두고 `SELECT … FOR UPDATE`로 해당 지갑의 변경 순서를 정합니다. 트랜잭션은 PostgreSQL `ReadCommitted`로 실행합니다.
- 충전·차감·환급의 `(tenantId, idempotencyKey)`가 고유합니다. 같은 내용의 재시도는 **처음 발행한 원장 기록**을 반환하고, 같은 키로 다른 내용을 보내면 거절합니다.
- 차감은 `balance >= credits` 조건부 UPDATE로 수행합니다. 잔액 변경·사용 주문·원장 영수증은 하나의 트랜잭션으로 커밋됩니다. SQL CHECK도 음수 잔액을 금지합니다.
- 주문별 차감·전액 환급은 각각 한 번입니다. 환급 금액을 클라이언트가 지정하지 않고 원래 주문에서 읽습니다. 이미 환급된 주문을 다른 키로 다시 환급할 수 없습니다. 차감 재시도는 환급 후에도 원래 영수증을 반환합니다.
- 실패한 요청은 원장에 남지 않습니다. 잔액 부족 후 충전됐다면 같은 요청 키로 재시도할 수 있습니다.
- 크레딧은 정수이며 요청당 1~1,000,000입니다. 지갑은 PostgreSQL INTEGER 범위 안에서만 동작하고 오버플로는 트랜잭션 오류로 처리됩니다.

```mermaid
erDiagram
    Wallet ||--o{ UsageOrder : tenant
    Wallet ||--o{ LedgerEntry : tenant
    UsageOrder o|--o{ LedgerEntry : optional_order
    Wallet {
        string tenantId PK
        int balance
    }
    UsageOrder {
        string tenantId PK
        string orderId PK
        int credits
        enum status
    }
    LedgerEntry {
        string id PK
        string tenantId
        string idempotencyKey
        enum kind
        int delta
        string orderId
        datetime createdAt
    }
```

`src/ledger.ts`는 신뢰된 서버가 전달한 tenant를 사용하는 서비스 계층입니다. HTTP 인증·조직 membership·권한 검증은 구현하지 않았습니다. 데이터 namespace 분리는 사용자 인증을 대신하지 않습니다. 모든 쓰기가 이 서비스를 통한다는 가정이며, DB 관리자에게 원장 UPDATE/DELETE를 막는 권한 체계는 없습니다.

## 실제 검증

[실행 보고서](reports/README.md)와 [원본 EXPLAIN JSON](reports/explain.json)에 범위와 환경을 기록했습니다.

1. 충전 재시도 10개가 기록 하나만 생성하고 변경된 payload를 거절.
2. 중복 차감 10개가 주문·차감을 한 번만 생성.
3. 7크레딧에 서로 다른 주문 20개 동시 요청: 7개 성공, 13개 잔액 부족, 최종 잔액 0.
4. 같은 key/order ID를 가진 서로 다른 tenant의 잔액·환급 분리.
5. 잔액 부족 시 주문·기록 없음, 충전 후 동일 키 재시도 가능.
6. 환급 재시도 20개에 전액 한 번 복원, 다른 키의 이중 환급 거절.
7. 마지막 원장 INSERT에 실제 PostgreSQL trigger 오류를 주입해 앞선 잔액·주문 쓰기도 rollback됨을 검증.
8. 잘못된 금액과 SQL을 통한 음수 잔액을 거절.

인덱스 실험은 합성 원장 100,000개 / 20 tenant에서 최신 20건을 읽습니다. 기존 tenant 인덱스와 정렬 계획을 `(tenantId, createdAt DESC, id DESC)` 인덱스로 바꿨을 때 실행 계획과 읽은 행 수를 확인합니다. 인덱스 생성은 캐시를 데우므로 단일 전후 시간으로 운영 속도 개선율을 주장하지 않습니다. 스크립트는 트랜잭션 안에서 인덱스를 제거·복원하므로 중간 실패 시 원래 인덱스를 유지합니다.

## 재현

Node.js 22 이상, Docker가 필요합니다. 아래 DB는 임시 실험 전용입니다. 비밀번호도 공개된 로컬 테스트 값입니다. 기존 DB 주소를 사용하지 마세요. 컨테이너 이름이나 55439 포트가 이미 사용 중이면 새 이름·빈 포트를 선택하고 연결 문자열도 함께 변경합니다.

```sh
docker run --detach --name timely-ledger-lab-local \
  --publish 127.0.0.1:55439:5432 \
  --env POSTGRES_USER=ledger_lab --env POSTGRES_PASSWORD=lab-only-local \
  --env POSTGRES_DB=timely_ledger_lab postgres:16-alpine
docker exec timely-ledger-lab-local pg_isready -U ledger_lab -d timely_ledger_lab
```

`pg_isready`가 연결 가능 상태를 반환한 뒤 이 폴더에서 실행합니다:

```sh
export DATABASE_URL='postgresql://ledger_lab:lab-only-local@127.0.0.1:55439/timely_ledger_lab?connection_limit=25'
export LEDGER_LAB_TEST=1
npm ci
npm run generate
npm run migrate
npm run typecheck
npm test
npm run explain
docker rm -f timely-ledger-lab-local
```

PowerShell에서는 `export` 대신 `$env:DATABASE_URL='...'`, `$env:LEDGER_LAB_TEST='1'`을 사용하고 필요한 경우 `npm.cmd`를 실행합니다. 테스트·측정 스크립트는 loopback 호스트, `timely_ledger_lab` DB명과 `LEDGER_LAB_TEST=1`을 요구합니다. 테스트는 무작위 tenant를 사용하며 기존 테이블 전체 삭제나 migration reset을 하지 않습니다. 단, 테스트용 실패 trigger와 인덱스 실험 때문에 다른 작업이 없는 전용 DB에서만 실행해야 합니다.

`ci.workflow.yml`과 저장소 루트 `.github/workflows/backend-ledger.yml`에 같은 GitHub Actions 구성을 제공합니다. 독립 PostgreSQL service에서 migration·typecheck·통합 테스트·EXPLAIN을 실행합니다. artifact에는 해당 실행에서 생성한 로그와 EXPLAIN만 포함합니다. 이 파일의 존재 자체는 원격 CI 실행 성공 증거가 아닙니다.

## 남은 범위

NestJS HTTP API, 인증된 tenant 연결, 실제 결제 webhook 서명 검증, 부분 환급, 외부 결제 상태 reconciliation, Redis 작업 큐, outbox, 보존 정책과 다중 인스턴스 부하 시험은 없습니다. 지갑 하나의 쓰기는 직렬화하므로 hot tenant 처리량을 별도 측정해야 합니다. 타임아웃 뒤 결과 확인에는 같은 idempotency key를 다시 사용해야 하며, 모든 오류를 자동 재시도하는 코드는 넣지 않았습니다.

Prisma 6.19.0을 lockfile에 고정했습니다. [Prisma v6 transaction 문서](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions)와 [Migrate 문서](https://www.prisma.io/docs/orm/v6/prisma-migrate/getting-started)를 기준으로 구현했습니다.
