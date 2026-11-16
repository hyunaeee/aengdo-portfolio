CREATE TYPE "EntryKind" AS ENUM ('GRANT', 'DEBIT', 'REFUND');
CREATE TYPE "OrderStatus" AS ENUM ('DEBITED', 'REFUNDED');
CREATE TABLE "Wallet" (
  "tenantId" TEXT NOT NULL PRIMARY KEY,
  "balance" INTEGER NOT NULL DEFAULT 0 CHECK ("balance" >= 0)
);
CREATE TABLE "UsageOrder" (
  "tenantId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "credits" INTEGER NOT NULL CHECK ("credits" > 0),
  "status" "OrderStatus" NOT NULL DEFAULT 'DEBITED',
  PRIMARY KEY ("tenantId", "orderId"),
  FOREIGN KEY ("tenantId") REFERENCES "Wallet" ("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "LedgerEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "kind" "EntryKind" NOT NULL,
  "delta" INTEGER NOT NULL,
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tenantId") REFERENCES "Wallet" ("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("tenantId", "orderId") REFERENCES "UsageOrder" ("tenantId", "orderId") ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK (("kind" = 'GRANT' AND "delta" > 0 AND "orderId" IS NULL)
    OR ("kind" = 'DEBIT' AND "delta" < 0 AND "orderId" IS NOT NULL)
    OR ("kind" = 'REFUND' AND "delta" > 0 AND "orderId" IS NOT NULL))
);
CREATE UNIQUE INDEX "LedgerEntry_tenantId_idempotencyKey_key" ON "LedgerEntry" ("tenantId", "idempotencyKey");
CREATE UNIQUE INDEX "LedgerEntry_tenantId_orderId_kind_key" ON "LedgerEntry" ("tenantId", "orderId", "kind");
