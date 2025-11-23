import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763882891126 implements MigrationInterface {
    name = 'Migration1763882891126'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."promotions_discounttype_enum" AS ENUM('percentage', 'fixed')`);
        await queryRunner.query(`CREATE TABLE "promotions" ("id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "eligibleCategories" text, "eligibleItems" text, "discountType" "public"."promotions_discounttype_enum" NOT NULL, "discountValue" double precision NOT NULL, "expirationDate" TIMESTAMP NOT NULL, "usageLimit" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_8ab10e580f70c3d2e2e4b31ebf2" UNIQUE ("code"), CONSTRAINT "PK_380cecbbe3ac11f0e5a7c452c34" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8ab10e580f70c3d2e2e4b31ebf" ON "promotions" ("code") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8ab10e580f70c3d2e2e4b31ebf"`);
        await queryRunner.query(`DROP TABLE "promotions"`);
        await queryRunner.query(`DROP TYPE "public"."promotions_discounttype_enum"`);
    }

}
