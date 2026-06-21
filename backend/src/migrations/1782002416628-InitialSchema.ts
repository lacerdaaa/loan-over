import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1782002416628 implements MigrationInterface {
  name = 'InitialSchema1782002416628';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."incomes_type_enum" AS ENUM('fixed', 'variable')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."incomes_category_enum" AS ENUM('salary', 'rent', 'benefit', 'other')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"        uuid              NOT NULL DEFAULT gen_random_uuid(),
        "google_id" character varying NOT NULL,
        "email"     character varying NOT NULL,
        "name"      character varying,
        "avatar"    character varying,
        CONSTRAINT "UQ_users_google_id" UNIQUE ("google_id"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "incomes" (
        "id"          uuid                          NOT NULL DEFAULT gen_random_uuid(),
        "type"        "public"."incomes_type_enum"  NOT NULL,
        "category"    "public"."incomes_category_enum" NOT NULL DEFAULT 'other',
        "amount"      numeric(10,2)                 NOT NULL,
        "month"       integer,
        "year"        integer,
        "description" character varying             NOT NULL,
        CONSTRAINT "PK_incomes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "income_deductions" (
        "id"        uuid          NOT NULL DEFAULT gen_random_uuid(),
        "label"     character varying NOT NULL,
        "amount"    numeric(10,2) NOT NULL,
        "income_id" uuid,
        CONSTRAINT "PK_income_deductions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "income_deductions"
        ADD CONSTRAINT "FK_income_deductions_income"
        FOREIGN KEY ("income_id") REFERENCES "incomes"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      CREATE TABLE "debts" (
        "id"                  uuid              NOT NULL DEFAULT gen_random_uuid(),
        "name"                character varying NOT NULL,
        "installment_amount"  numeric(10,2)     NOT NULL,
        "total_installments"  integer           NOT NULL,
        "paid_installments"   integer           NOT NULL DEFAULT 0,
        "start_date"          date              NOT NULL,
        "closed"              boolean           NOT NULL DEFAULT false,
        CONSTRAINT "PK_debts" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "fixed_expenses" (
        "id"           uuid              NOT NULL DEFAULT gen_random_uuid(),
        "name"         character varying NOT NULL,
        "amount"       numeric(10,2)     NOT NULL,
        "due_day"      integer           NOT NULL,
        "active"       boolean           NOT NULL DEFAULT true,
        "from_benefit" boolean           NOT NULL DEFAULT false,
        CONSTRAINT "PK_fixed_expenses" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "occasional_expenses" (
        "id"           uuid              NOT NULL DEFAULT gen_random_uuid(),
        "description"  character varying NOT NULL,
        "amount"       numeric(10,2)     NOT NULL,
        "month"        integer           NOT NULL,
        "year"         integer           NOT NULL,
        "from_benefit" boolean           NOT NULL DEFAULT false,
        CONSTRAINT "PK_occasional_expenses" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "goals" (
        "id"              uuid          NOT NULL DEFAULT gen_random_uuid(),
        "target_amount"   numeric(10,2) NOT NULL,
        "deadline_month"  integer       NOT NULL,
        "deadline_year"   integer       NOT NULL,
        "monthly_min"     numeric(10,2),
        CONSTRAINT "PK_goals" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "goals"`);
    await queryRunner.query(`DROP TABLE "occasional_expenses"`);
    await queryRunner.query(`DROP TABLE "fixed_expenses"`);
    await queryRunner.query(`DROP TABLE "debts"`);
    await queryRunner.query(`ALTER TABLE "income_deductions" DROP CONSTRAINT "FK_income_deductions_income"`);
    await queryRunner.query(`DROP TABLE "income_deductions"`);
    await queryRunner.query(`DROP TABLE "incomes"`);
    await queryRunner.query(`DROP TYPE "public"."incomes_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."incomes_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
