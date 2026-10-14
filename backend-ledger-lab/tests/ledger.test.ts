import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { CreditLedger, LedgerError } from '../src/ledger.js';
import { testDatabase } from '../src/test-database.js';

const db = testDatabase();
const ledger = new CreditLedger(db);
after(() => db.$disconnect());
const errorCode = (code: string) => (error: unknown) => error instanceof LedgerError && error.code === code;
async function tenant() {
  const tenantId = `test-${randomUUID()}`;
  await db.wallet.create({ data: { tenantId } });
  return tenantId;
}
async function assertBalanced(tenantId: string, expected: number) {
  const wallet = await db.wallet.findUniqueOrThrow({ where: { tenantId } });
  const sum = await db.ledgerEntry.aggregate({ where: { tenantId }, _sum: { delta: true } });
  assert.equal(wallet.balance, expected);
  assert.equal(sum._sum.delta ?? 0, expected, 'wallet must reconcile to append-only ledger deltas');
}

test('concurrent grant retries return one entry; changed payload cannot reuse its key', async () => {
  const id = await tenant();
  const results = await Promise.all(Array.from({ length: 10 }, () => ledger.grant(id, 'grant-1', 7)));
  assert.equal(new Set(results.map(result => result.id)).size, 1);
  await assert.rejects(ledger.grant(id, 'grant-1', 8), errorCode('IDEMPOTENCY_CONFLICT'));
  await assertBalanced(id, 7);
});

test('concurrent debit retries create one order and one charge', async () => {
  const id = await tenant();
  await ledger.grant(id, 'grant', 10);
  const results = await Promise.all(Array.from({ length: 10 }, () => ledger.debit(id, 'debit', 'order', 3)));
  assert.equal(new Set(results.map(result => result.id)).size, 1);
  assert.equal(await db.usageOrder.count({ where: { tenantId: id } }), 1);
  assert.equal(await db.ledgerEntry.count({ where: { tenantId: id, kind: 'DEBIT' } }), 1);
  await assert.rejects(ledger.debit(id, 'new-key', 'order', 3), errorCode('ORDER_CONFLICT'));
  await assertBalanced(id, 7);
});

test('20 concurrent orders competing for 7 credits yield 7 charges and no negative balance', async () => {
  const id = await tenant();
  await ledger.grant(id, 'grant', 7);
  const results = await Promise.allSettled(Array.from({ length: 20 }, (_, i) => ledger.debit(id, `debit-${i}`, `order-${i}`, 1)));
  const rejected = results.filter(result => result.status === 'rejected');
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 7);
  assert.equal(rejected.length, 13);
  assert.ok(rejected.every(result => errorCode('INSUFFICIENT_CREDITS')(result.reason)));
  assert.equal(await db.usageOrder.count({ where: { tenantId: id } }), 7);
  await assertBalanced(id, 0);
});

test('tenant namespaces isolate identical keys and order IDs, including refunds', async () => {
  const a = await tenant(), b = await tenant();
  await ledger.grant(a, 'grant', 10);
  await ledger.grant(b, 'grant', 20);
  await ledger.debit(a, 'debit', 'same-order', 4);
  await assert.rejects(ledger.refund(b, 'refund', 'same-order'), errorCode('NOT_FOUND'));
  await ledger.debit(b, 'debit', 'same-order', 5);
  await ledger.refund(a, 'refund', 'same-order');
  await assertBalanced(a, 10);
  await assertBalanced(b, 15);
});

test('insufficient funds leave no order or entry and the request can succeed after a grant', async () => {
  const id = await tenant();
  await assert.rejects(ledger.debit(id, 'debit', 'order', 5), errorCode('INSUFFICIENT_CREDITS'));
  assert.equal(await db.usageOrder.count({ where: { tenantId: id } }), 0);
  assert.equal(await db.ledgerEntry.count({ where: { tenantId: id } }), 0);
  await ledger.grant(id, 'grant', 5);
  await ledger.debit(id, 'debit', 'order', 5);
  await assertBalanced(id, 0);
});

test('20 duplicate refunds restore credits once; new keys cannot refund the order twice', async () => {
  const id = await tenant();
  await ledger.grant(id, 'grant', 9);
  const debit = await ledger.debit(id, 'debit', 'order', 9);
  const results = await Promise.all(Array.from({ length: 20 }, () => ledger.refund(id, 'refund', 'order')));
  assert.equal(new Set(results.map(result => result.id)).size, 1);
  assert.equal(await db.ledgerEntry.count({ where: { tenantId: id, kind: 'REFUND' } }), 1);
  await assert.rejects(ledger.refund(id, 'other-key', 'order'), errorCode('ORDER_CONFLICT'));
  assert.equal((await ledger.debit(id, 'debit', 'order', 9)).id, debit.id, 'a retry remains the original receipt after refund');
  assert.equal((await db.usageOrder.findUniqueOrThrow({ where: { tenantId_orderId: { tenantId: id, orderId: 'order' } } })).status, 'REFUNDED');
  await assertBalanced(id, 9);
});

test('a database failure after debit rolls back wallet, order, and idempotency receipt together', async () => {
  const id = await tenant();
  await ledger.grant(id, 'grant', 5);
  // Force a real database error at the last write, after the wallet/order writes.
  await db.$executeRawUnsafe(`CREATE FUNCTION lab_reject_entry() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected ledger persistence failure'; END $$`);
  await db.$executeRawUnsafe(`CREATE TRIGGER lab_reject_entry BEFORE INSERT ON "LedgerEntry" FOR EACH ROW WHEN (NEW."idempotencyKey" = 'fail-at-last-write') EXECUTE FUNCTION lab_reject_entry()`);
  try {
    await assert.rejects(ledger.debit(id, 'fail-at-last-write', 'order', 5), /injected ledger persistence failure/);
    assert.equal(await db.usageOrder.count({ where: { tenantId: id } }), 0);
    assert.equal(await db.ledgerEntry.count({ where: { tenantId: id } }), 1);
    await assertBalanced(id, 5);
  } finally {
    await db.$executeRawUnsafe('DROP TRIGGER lab_reject_entry ON "LedgerEntry"');
    await db.$executeRawUnsafe('DROP FUNCTION lab_reject_entry()');
  }
  await ledger.debit(id, 'fail-at-last-write', 'order', 5);
  await assertBalanced(id, 0);
});

test('invalid amounts fail before writes and SQL constraints reject negative balances', async () => {
  const id = await tenant();
  for (const amount of [0, -1, 0.5, NaN, 1_000_001]) {
    await assert.rejects(ledger.grant(id, 'invalid', amount), errorCode('INVALID_INPUT'));
  }
  await assert.rejects(db.$executeRaw`UPDATE "Wallet" SET "balance" = -1 WHERE "tenantId" = ${id}`);
  await assertBalanced(id, 0);
});
