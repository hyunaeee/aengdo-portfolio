CREATE INDEX "ledger_tenant_history_idx" ON "LedgerEntry" ("tenantId", "createdAt" DESC, "id" DESC);
