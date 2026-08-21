import { createHash } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankTransaction } from './bank-transaction.entity';
import { ImportTransactionsDto } from './dto/import-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

const NULL_MATCHED_ID_KINDS = new Set(['payroll', 'ignored']);

function computeHash(userId: string, date: string, amount: number, description: string): string {
  return createHash('sha256')
    .update(`${userId}|${date}|${amount}|${description}`)
    .digest('hex');
}

function deriveMonthYear(date: string): { month: number; year: number } {
  const parsed = new Date(date);
  return { month: parsed.getUTCMonth() + 1, year: parsed.getUTCFullYear() };
}

@Injectable()
export class BankTransactionService {
  constructor(
    @InjectRepository(BankTransaction)
    private readonly repo: Repository<BankTransaction>,
  ) {}

  findForMonth(userId: string, month: number, year: number): Promise<BankTransaction[]> {
    return this.repo.find({
      where: { user: { id: userId }, month, year },
      order: { date: 'ASC' },
    });
  }

  async import(
    userId: string,
    dto: ImportTransactionsDto,
  ): Promise<{ imported: number; skipped: number }> {
    const existing = await this.repo.find({
      where: { user: { id: userId } },
      select: { import_hash: true },
    });
    const existingHashes = new Set(existing.map((tx) => tx.import_hash));

    const toInsert: BankTransaction[] = [];
    const seenInBatch = new Set<string>();
    let skipped = 0;

    for (const line of dto.transactions) {
      const hash = computeHash(userId, line.date, line.amount, line.description);

      if (existingHashes.has(hash) || seenInBatch.has(hash)) {
        skipped++;
        continue;
      }

      seenInBatch.add(hash);
      const { month, year } = deriveMonthYear(line.date);
      toInsert.push(
        this.repo.create({
          user: { id: userId },
          date: line.date,
          description: line.description,
          amount: line.amount,
          month,
          year,
          import_hash: hash,
          matched_kind: null,
          matched_id: null,
        }),
      );
    }

    if (toInsert.length > 0) {
      await this.repo.save(toInsert);
    }

    return { imported: toInsert.length, skipped };
  }

  async updateMatch(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<BankTransaction> {
    const tx = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!tx) throw new NotFoundException(`BankTransaction ${id} not found`);

    const kind = dto.matched_kind ?? null;
    const matchedId =
      kind === null || NULL_MATCHED_ID_KINDS.has(kind) ? null : (dto.matched_id ?? null);

    tx.matched_kind = kind;
    tx.matched_id = matchedId;

    return this.repo.save(tx);
  }

  async remove(userId: string, id: string): Promise<void> {
    const tx = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!tx) throw new NotFoundException(`BankTransaction ${id} not found`);
    await this.repo.delete(id);
  }
}
