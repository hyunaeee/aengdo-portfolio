import { mkdir, writeFile } from 'node:fs/promises';
import { testDatabase } from '../src/test-database.js';

const db = testDatabase();
try {
  // Dedicated synthetic tenants; no customer or payment provider data.
  await db.$executeRawUnsafe(`INSERT INTO "Wallet" ("tenantId", "balance") SELECT 'benchmark-' || n, 5000 FROM generate_series(0,19) n ON CONFLICT DO NOTHING`);
  await db.$executeRawUnsafe(`INSERT INTO "LedgerEntry" ("id", "tenantId", "idempotencyKey", "kind", "delta", "createdAt")
    SELECT 'benchmark-entry-' || n, 'benchmark-' || (n % 20), 'benchmark-key-' || n, 'GRANT', 1,
      TIMESTAMP '2026-01-01' + n * INTERVAL '1 second'
    FROM generate_series(1,100000) n ON CONFLICT DO NOTHING`);
  await db.$executeRawUnsafe('ANALYZE "LedgerEntry"');
  const result = await db.$transaction(async tx => {
    // Transactional DDL restores the original index if any step fails.
    await tx.$executeRawUnsafe('DROP INDEX "ledger_tenant_history_idx"');
    const query = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT "id", "delta", "createdAt" FROM "LedgerEntry"
      WHERE "tenantId" = 'benchmark-7' ORDER BY "createdAt" DESC, "id" DESC LIMIT 20`;
    const before = await tx.$queryRawUnsafe(query);
    await tx.$executeRawUnsafe('CREATE INDEX "ledger_tenant_history_idx" ON "LedgerEntry" ("tenantId", "createdAt" DESC, "id" DESC)');
    const after = await tx.$queryRawUnsafe(query);
    return { before, after };
  }, { timeout: 60_000 });
  const version = await db.$queryRaw<Array<{ version: string }>>`SELECT version()`;
  const report = {
    recordedAt: new Date().toISOString(),
    scope: 'Synthetic dedicated PostgreSQL lab; one local before/after query, not a production performance claim.',
    rows: 100000, tenants: 20, rowsPerTenant: 5000, limit: 20,
    node: process.version, postgres: version[0].version,
    caution: 'Index creation warms data pages. Plan shape and scanned rows matter more than this single timing sample.',
    ...result,
  };
  await mkdir('reports', { recursive: true });
  await writeFile('reports/explain.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await db.$disconnect();
}
