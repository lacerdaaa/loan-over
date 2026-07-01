import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDebtInterestFields1782002416629 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE debts
        ADD COLUMN IF NOT EXISTS principal DECIMAL(10,2) NULL,
        ADD COLUMN IF NOT EXISTS monthly_rate DECIMAL(10,4) NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE debts
        DROP COLUMN IF EXISTS principal,
        DROP COLUMN IF EXISTS monthly_rate
    `);
  }
}
