import { ProjectionInputAssembler } from '../projection/projection-input.assembler';
import { ProjectionService } from '../projection/projection.service';
import { ProjectedMonth, ProjectionEvent } from '../shared/types';
import { SnapshotInputAssembler } from '../snapshot/snapshot-input.assembler';
import { SnapshotService } from '../snapshot/snapshot.service';
import { MonthlyReportBuilder } from './monthly-report.builder';

const USER_ID = 'user-1';
const NOW = new Date('2027-03-01T12:00:00Z');

const liberation = (name: string, amount: number): ProjectionEvent => ({
  type: 'liberation',
  description: `${name} quitada`,
  amount,
  debt_name: name,
});

const projected = (month: number, events: ProjectionEvent[]): ProjectedMonth => ({
  month,
  year: 2027,
  free_balance: 0,
  events,
  active_debts: 0,
  total_outflow: 0,
  cumulative_balance: 0,
});

describe('MonthlyReportBuilder', () => {
  const snapshotInput = { month: 3, year: 2027 };
  const projectionInput = { referenceMonth: 3, referenceYear: 2027 };
  let snapshotAssembler: { assemble: jest.Mock };
  let snapshotService: { compute: jest.Mock };
  let projectionAssembler: { assemble: jest.Mock };
  let projectionService: { project: jest.Mock };
  let builder: MonthlyReportBuilder;

  beforeEach(() => {
    snapshotAssembler = { assemble: jest.fn().mockResolvedValue(snapshotInput) };
    snapshotService = {
      compute: jest.fn().mockReturnValue({
        month: 3,
        year: 2027,
        total_income: 5000,
        total_fixed: 1500,
        total_debts: 800,
        total_occasional: 200,
        total_benefit: 0,
        total_debt_balance: 0,
        free_balance: 2500,
      }),
    };
    projectionAssembler = { assemble: jest.fn().mockResolvedValue(projectionInput) };
    projectionService = { project: jest.fn().mockReturnValue([]) };
    builder = new MonthlyReportBuilder(
      snapshotAssembler as unknown as SnapshotInputAssembler,
      snapshotService as unknown as SnapshotService,
      projectionAssembler as unknown as ProjectionInputAssembler,
      projectionService as unknown as ProjectionService,
    );
  });

  it('assembles both inputs for the month of the reference date', async () => {
    await builder.build(USER_ID, NOW);

    expect(snapshotAssembler.assemble).toHaveBeenCalledWith(USER_ID, 3, 2027);
    expect(projectionAssembler.assemble).toHaveBeenCalledWith(USER_ID, 3, 2027);
  });

  it('copies the snapshot totals into the report', async () => {
    const report = await builder.build(USER_ID, NOW);

    expect(report).toMatchObject({
      month: 3,
      year: 2027,
      total_income: 5000,
      total_fixed: 1500,
      total_debts: 800,
      total_occasional: 200,
      free_balance: 2500,
    });
  });

  it('keeps the first three liberations in chronological order with their month', async () => {
    projectionService.project.mockReturnValue([
      projected(3, [{ type: 'alert', description: 'x', amount: 1 }]),
      projected(4, [liberation('A', 10), liberation('B', 20)]),
      projected(5, [liberation('C', 30)]),
      projected(6, [liberation('D', 40)]),
    ]);

    const report = await builder.build(USER_ID, NOW);

    expect(report.upcomingLiberations).toEqual([
      { debt_name: 'A', amount: 10, month: 4, year: 2027 },
      { debt_name: 'B', amount: 20, month: 4, year: 2027 },
      { debt_name: 'C', amount: 30, month: 5, year: 2027 },
    ]);
  });

  it('falls back to the event description when a liberation has no debt name', async () => {
    projectionService.project.mockReturnValue([
      projected(4, [{ type: 'liberation', description: 'Dívida quitada', amount: 10 }]),
    ]);

    const report = await builder.build(USER_ID, NOW);

    expect(report.upcomingLiberations[0]?.debt_name).toBe('Dívida quitada');
  });
});
