import { Injectable } from '@nestjs/common';
import { ProjectionInputAssembler } from '../projection/projection-input.assembler';
import { ProjectionService } from '../projection/projection.service';
import { ProjectedMonth } from '../shared/types';
import { SnapshotInputAssembler } from '../snapshot/snapshot-input.assembler';
import { SnapshotService } from '../snapshot/snapshot.service';
import { MonthlyReportData, UpcomingLiberation } from './notification.composer';

const REPORT_HORIZON_MONTHS = 24;
const MAX_UPCOMING_LIBERATIONS = 3;

@Injectable()
export class MonthlyReportBuilder {
  constructor(
    private readonly snapshotAssembler: SnapshotInputAssembler,
    private readonly snapshotService: SnapshotService,
    private readonly projectionAssembler: ProjectionInputAssembler,
    private readonly projectionService: ProjectionService,
  ) {}

  async build(userId: string, now: Date): Promise<MonthlyReportData> {
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();
    const [snapshotInput, projectionInput] = await Promise.all([
      this.snapshotAssembler.assemble(userId, month, year),
      this.projectionAssembler.assemble(userId, month, year),
    ]);
    const snapshot = this.snapshotService.compute(snapshotInput);
    const upcomingLiberations = this.upcomingLiberations(
      this.projectionService.project(projectionInput, REPORT_HORIZON_MONTHS),
    );
    return {
      month: snapshot.month,
      year: snapshot.year,
      total_income: snapshot.total_income,
      total_fixed: snapshot.total_fixed,
      total_debts: snapshot.total_debts,
      total_occasional: snapshot.total_occasional,
      free_balance: snapshot.free_balance,
      upcomingLiberations,
    };
  }

  private upcomingLiberations(months: ProjectedMonth[]): UpcomingLiberation[] {
    return months
      .flatMap((m) =>
        m.events
          .filter((e) => e.type === 'liberation')
          .map((e) => ({
            debt_name: e.debt_name ?? e.description,
            amount: e.amount,
            month: m.month,
            year: m.year,
          })),
      )
      .slice(0, MAX_UPCOMING_LIBERATIONS);
  }
}
