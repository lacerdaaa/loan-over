import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDebtLastPaidMonth1791832296143 implements MigrationInterface {
  name = 'AddDebtLastPaidMonth1791832296143';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "debts" ADD "last_paid_month" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "debts" DROP COLUMN "last_paid_month"`);
  }
}
