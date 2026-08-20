import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdMultiTenant1785976863317 implements MigrationInterface {
  name = 'AddUserIdMultiTenant1785976863317';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "debts" ADD "user_id" uuid`);
    await queryRunner.query(`ALTER TABLE "fixed_expenses" ADD "user_id" uuid`);
    await queryRunner.query(`ALTER TABLE "goals" ADD "user_id" uuid`);
    await queryRunner.query(`ALTER TABLE "incomes" ADD "user_id" uuid`);
    await queryRunner.query(`ALTER TABLE "occasional_expenses" ADD "user_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "debts" ADD CONSTRAINT "FK_c7948d788f06ddc7e0e6ce68ca3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fixed_expenses" ADD CONSTRAINT "FK_68ea0384dbac40330f320c91d47" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" ADD CONSTRAINT "FK_88b78010581f2d293699d064441" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incomes" ADD CONSTRAINT "FK_400664fad260d8fa50ecb78ffe6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "occasional_expenses" ADD CONSTRAINT "FK_c5a41295b8d03edf9abc770d694" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "occasional_expenses" DROP CONSTRAINT "FK_c5a41295b8d03edf9abc770d694"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incomes" DROP CONSTRAINT "FK_400664fad260d8fa50ecb78ffe6"`,
    );
    await queryRunner.query(`ALTER TABLE "goals" DROP CONSTRAINT "FK_88b78010581f2d293699d064441"`);
    await queryRunner.query(
      `ALTER TABLE "fixed_expenses" DROP CONSTRAINT "FK_68ea0384dbac40330f320c91d47"`,
    );
    await queryRunner.query(`ALTER TABLE "debts" DROP CONSTRAINT "FK_c7948d788f06ddc7e0e6ce68ca3"`);
    await queryRunner.query(`ALTER TABLE "occasional_expenses" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "incomes" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "goals" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "fixed_expenses" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "debts" DROP COLUMN "user_id"`);
  }
}
