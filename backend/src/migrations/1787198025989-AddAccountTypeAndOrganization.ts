import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountTypeAndOrganization1787198025989 implements MigrationInterface {
  name = 'AddAccountTypeAndOrganization1787198025989';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "cnpj" character varying, "cash_balance" numeric(12,2) NOT NULL, "user_id" uuid, CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "account_type" character varying`);
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD CONSTRAINT "FK_245468c5a2914202a3081b1494e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT "FK_245468c5a2914202a3081b1494e"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "account_type"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
  }
}
