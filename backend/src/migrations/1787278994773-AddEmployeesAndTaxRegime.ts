import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeesAndTaxRegime1787278994773 implements MigrationInterface {
  name = 'AddEmployeesAndTaxRegime1787278994773';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "regime" character varying NOT NULL, "gross_salary" numeric(10,2) NOT NULL, "monthly_benefits" numeric(10,2) NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, "user_id" uuid, CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "tax_regime" character varying NOT NULL DEFAULT 'simples'`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD CONSTRAINT "FK_2d83c53c3e553a48dadb9722e38" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT "FK_2d83c53c3e553a48dadb9722e38"`,
    );
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "tax_regime"`);
    await queryRunner.query(`DROP TABLE "employees"`);
  }
}
