-- CreateEnum
CREATE TYPE "VerifactuSubmissionStatus" AS ENUM ('NO_CONFIGURADO', 'PENDIENTE_ENVIO', 'ENVIADO', 'ERROR');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "verifactuQrUrl" TEXT,
ADD COLUMN     "verifactuRecord" JSONB,
ADD COLUMN     "verifactuSubmissionError" TEXT,
ADD COLUMN     "verifactuSubmissionStatus" "VerifactuSubmissionStatus" NOT NULL DEFAULT 'NO_CONFIGURADO';
