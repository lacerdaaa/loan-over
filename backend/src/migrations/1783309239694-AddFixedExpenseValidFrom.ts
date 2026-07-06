import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFixedExpenseValidFrom1783309239694 implements MigrationInterface {
    name = 'AddFixedExpenseValidFrom1783309239694'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fixed_expenses" ADD "valid_from_month" integer`);
        await queryRunner.query(`ALTER TABLE "fixed_expenses" ADD "valid_from_year" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fixed_expenses" DROP COLUMN "valid_from_year"`);
        await queryRunner.query(`ALTER TABLE "fixed_expenses" DROP COLUMN "valid_from_month"`);
    }

}
