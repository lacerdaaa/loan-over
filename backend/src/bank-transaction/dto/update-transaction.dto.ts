import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import type { MatchKind } from '../bank-transaction.entity';

const MATCH_KINDS: MatchKind[] = [
  'income',
  'fixed_expense',
  'debt',
  'occasional_expense',
  'payroll',
  'ignored',
];

export class UpdateTransactionDto {
  /**
   * Pass one of the six MatchKind values to match, or null to unmatch.
   * When matched_kind is 'payroll' or 'ignored', matched_id is ignored and stored as null.
   */
  @ApiPropertyOptional({
    enum: [...MATCH_KINDS, null],
    nullable: true,
    description: 'null unmatches the transaction',
  })
  @IsOptional()
  @ValidateIf((o: UpdateTransactionDto) => o.matched_kind !== null)
  @IsIn(MATCH_KINDS)
  matched_kind?: MatchKind | null;

  @ApiPropertyOptional({ example: 'a0f1c3d2-...', description: 'UUID of the matched entity' })
  @IsOptional()
  @IsUUID()
  matched_id?: string;
}
