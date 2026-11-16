import { PrismaClient } from '@prisma/client';

// Test and measurement scripts deliberately refuse ordinary database names.
export function testDatabase(): PrismaClient {
  const url = new URL(process.env.DATABASE_URL || 'postgresql://invalid/');
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/timely_ledger_lab' || process.env.LEDGER_LAB_TEST !== '1') {
    throw new Error('Use the dedicated loopback timely_ledger_lab database and LEDGER_LAB_TEST=1.');
  }
  return new PrismaClient();
}
