import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNotificationPreferences1791833123260 implements MigrationInterface {
  name = 'AddUserNotificationPreferences1791833123260';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email_notifications" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "monthly_report" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "monthly_report"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_notifications"`);
  }
}
