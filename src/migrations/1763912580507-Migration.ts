import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1763912580507 implements MigrationInterface {
    name = 'Migration1763912580507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "products" text array NOT NULL, "orderValue" double precision NOT NULL, "discountApplied" double precision NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "voucherId" integer, "promotionId" integer, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_4b8f5c0785f1c7e5255b72609cf" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_c9aa8830a99ae4415d1a2d0da70" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_c9aa8830a99ae4415d1a2d0da70"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_4b8f5c0785f1c7e5255b72609cf"`);
        await queryRunner.query(`DROP TABLE "orders"`);
    }

}
