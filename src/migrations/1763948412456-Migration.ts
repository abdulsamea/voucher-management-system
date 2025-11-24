import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763948412456 implements MigrationInterface {
    name = 'Migration1763948412456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."vouchers_discounttype_enum" AS ENUM('percentage', 'fixed')`);
        await queryRunner.query(`CREATE TABLE "vouchers" ("id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "discountType" "public"."vouchers_discounttype_enum" NOT NULL, "discountValue" double precision NOT NULL, "expirationDate" TIMESTAMP NOT NULL, "usageLimit" integer NOT NULL DEFAULT '1', "minOrderValue" double precision, CONSTRAINT "UQ_efc30b2b9169e05e0e1e19d6dd6" UNIQUE ("code"), CONSTRAINT "PK_ed1b7dd909a696560763acdbc04" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_efc30b2b9169e05e0e1e19d6dd" ON "vouchers" ("code") `);
        await queryRunner.query(`CREATE TYPE "public"."promotions_discounttype_enum" AS ENUM('percentage', 'fixed')`);
        await queryRunner.query(`CREATE TABLE "promotions" ("id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "eligibleSkus" text, "discountType" "public"."promotions_discounttype_enum" NOT NULL, "discountValue" double precision NOT NULL, "expirationDate" TIMESTAMP NOT NULL, "usageLimit" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_8ab10e580f70c3d2e2e4b31ebf2" UNIQUE ("code"), CONSTRAINT "PK_380cecbbe3ac11f0e5a7c452c34" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8ab10e580f70c3d2e2e4b31ebf" ON "promotions" ("code") `);
        await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "products" jsonb NOT NULL, "discountApplied" double precision NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "voucherId" integer, "promotionId" integer, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_4b8f5c0785f1c7e5255b72609cf" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_c9aa8830a99ae4415d1a2d0da70" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_c9aa8830a99ae4415d1a2d0da70"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_4b8f5c0785f1c7e5255b72609cf"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ab10e580f70c3d2e2e4b31ebf"`);
        await queryRunner.query(`DROP TABLE "promotions"`);
        await queryRunner.query(`DROP TYPE "public"."promotions_discounttype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_efc30b2b9169e05e0e1e19d6dd"`);
        await queryRunner.query(`DROP TABLE "vouchers"`);
        await queryRunner.query(`DROP TYPE "public"."vouchers_discounttype_enum"`);
    }

}
