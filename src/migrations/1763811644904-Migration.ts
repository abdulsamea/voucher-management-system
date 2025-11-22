import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763811644904 implements MigrationInterface {
    name = 'Migration1763811644904'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."vouchers_discounttype_enum" AS ENUM('percentage', 'fixed')`);
        await queryRunner.query(`CREATE TABLE "vouchers" ("id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "discountType" "public"."vouchers_discounttype_enum" NOT NULL, "discountValue" double precision NOT NULL, "expirationDate" TIMESTAMP NOT NULL, "usageLimit" integer NOT NULL DEFAULT '1', "minOrderValue" double precision, CONSTRAINT "UQ_efc30b2b9169e05e0e1e19d6dd6" UNIQUE ("code"), CONSTRAINT "PK_ed1b7dd909a696560763acdbc04" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_efc30b2b9169e05e0e1e19d6dd" ON "vouchers" ("code") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_efc30b2b9169e05e0e1e19d6dd"`);
        await queryRunner.query(`DROP TABLE "vouchers"`);
        await queryRunner.query(`DROP TYPE "public"."vouchers_discounttype_enum"`);
    }

}
