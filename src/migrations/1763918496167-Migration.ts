import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763918496167 implements MigrationInterface {
    name = 'Migration1763918496167'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "orderValue"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "products"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "products" jsonb NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "products"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "products" text array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "orderValue" double precision NOT NULL`);
    }

}
