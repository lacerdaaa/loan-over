import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserBilling1791833652898 implements MigrationInterface {
  name = 'AddUserBilling1791833652898';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "plan" character varying NOT NULL DEFAULT 'free'`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "stripe_customer_id" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "stripe_subscription_id" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "subscription_status" character varying`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "current_period_end" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "current_period_end"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "subscription_status"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripe_subscription_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripe_customer_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "plan"`);
  }
}
