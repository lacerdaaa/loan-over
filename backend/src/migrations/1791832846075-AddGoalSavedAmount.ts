import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoalSavedAmount1791832846075 implements MigrationInterface {
  name = 'AddGoalSavedAmount1791832846075';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "goals" ADD "saved_amount" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "goals" DROP COLUMN "saved_amount"`);
  }
}
