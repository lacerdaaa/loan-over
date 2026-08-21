import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBankTransactions1787281075028 implements MigrationInterface {
  name = 'AddBankTransactions1787281075028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "bank_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "description" character varying NOT NULL, "amount" numeric(12,2) NOT NULL, "month" integer NOT NULL, "year" integer NOT NULL, "matched_kind" character varying, "matched_id" uuid, "import_hash" character varying NOT NULL, "user_id" uuid, CONSTRAINT "PK_123cc87304eefb2c497b4acdd10" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_79d434de57384ef7bff5536967" ON "bank_transactions"  ("import_hash") `,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_transactions" ADD CONSTRAINT "FK_ccd5e28c20422bc2e9a12c0122a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bank_transactions" DROP CONSTRAINT "FK_ccd5e28c20422bc2e9a12c0122a"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_79d434de57384ef7bff5536967"`);
    await queryRunner.query(`DROP TABLE "bank_transactions"`);
  }
}
