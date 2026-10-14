import { EntryKind, Prisma, PrismaClient, type LedgerEntry } from '@prisma/client';

export class LedgerError extends Error {
  constructor(public readonly code: 'INVALID_INPUT' | 'NOT_FOUND' | 'IDEMPOTENCY_CONFLICT' | 'ORDER_CONFLICT' | 'INSUFFICIENT_CREDITS') {
    super(code);
  }
}

type Operation = { tenantId: string; idempotencyKey: string; kind: EntryKind; credits?: number; orderId?: string };

function validate(input: Operation) {
  for (const value of [input.tenantId, input.idempotencyKey, ...(input.orderId === undefined ? [] : [input.orderId])]) {
    if (typeof value !== 'string' || !value.trim() || value.length > 128) throw new LedgerError('INVALID_INPUT');
  }
  if (input.kind !== 'REFUND' && (!Number.isSafeInteger(input.credits) || input.credits! <= 0 || input.credits! > 1_000_000)) {
    throw new LedgerError('INVALID_INPUT');
  }
}

export class CreditLedger {
  constructor(private readonly db: PrismaClient) {}

  grant(tenantId: string, idempotencyKey: string, credits: number) {
    return this.apply({ tenantId, idempotencyKey, credits, kind: 'GRANT' });
  }

  debit(tenantId: string, idempotencyKey: string, orderId: string, credits: number) {
    return this.apply({ tenantId, idempotencyKey, orderId, credits, kind: 'DEBIT' });
  }

  refund(tenantId: string, idempotencyKey: string, orderId: string) {
    return this.apply({ tenantId, idempotencyKey, orderId, kind: 'REFUND' });
  }

  private async apply(input: Operation): Promise<LedgerEntry> {
    validate(input);
    return this.db.$transaction(async tx => {
      // One wallet is touched per operation. Lock ordering is therefore fixed.
      // ReadCommitted sees the preceding winner after waiting on this row lock.
      const wallets = await tx.$queryRaw<Array<{ tenantId: string }>>`
        SELECT "tenantId" FROM "Wallet" WHERE "tenantId" = ${input.tenantId} FOR UPDATE`;
      if (!wallets.length) throw new LedgerError('NOT_FOUND');
      const key = { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey };
      const prior = await tx.ledgerEntry.findUnique({ where: { tenantId_idempotencyKey: key } });
      if (prior) {
        const expectedDelta = input.kind === 'DEBIT' ? -input.credits! : input.credits;
        if (prior.kind !== input.kind || prior.orderId !== (input.orderId ?? null) ||
          (input.kind !== 'REFUND' && prior.delta !== expectedDelta)) throw new LedgerError('IDEMPOTENCY_CONFLICT');
        return prior;
      }

      let delta = input.credits!;
      if (input.kind === 'DEBIT') {
        const existingOrder = await tx.usageOrder.findUnique({ where: { tenantId_orderId: { tenantId: input.tenantId, orderId: input.orderId! } } });
        if (existingOrder) throw new LedgerError('ORDER_CONFLICT');
        const changed = await tx.wallet.updateMany({
          where: { tenantId: input.tenantId, balance: { gte: input.credits! } },
          data: { balance: { decrement: input.credits! } },
        });
        if (changed.count !== 1) throw new LedgerError('INSUFFICIENT_CREDITS');
        await tx.usageOrder.create({ data: { tenantId: input.tenantId, orderId: input.orderId!, credits: input.credits! } });
        delta = -input.credits!;
      } else if (input.kind === 'REFUND') {
        const order = await tx.usageOrder.findUnique({ where: { tenantId_orderId: { tenantId: input.tenantId, orderId: input.orderId! } } });
        if (!order) throw new LedgerError('NOT_FOUND');
        if (order.status !== 'DEBITED') throw new LedgerError('ORDER_CONFLICT');
        delta = order.credits;
        await tx.usageOrder.update({ where: { tenantId_orderId: { tenantId: input.tenantId, orderId: input.orderId! } }, data: { status: 'REFUNDED' } });
        await tx.wallet.update({ where: { tenantId: input.tenantId }, data: { balance: { increment: delta } } });
      } else {
        await tx.wallet.update({ where: { tenantId: input.tenantId }, data: { balance: { increment: delta } } });
      }
      return tx.ledgerEntry.create({ data: { ...key, kind: input.kind, delta, orderId: input.orderId } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 30_000, timeout: 30_000 });
  }
}
