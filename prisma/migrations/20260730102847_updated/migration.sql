/*
  Warnings:

  - You are about to drop the column `datetime` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `diagnoses` table. All the data in the column will be lost.
  - You are about to drop the column `medical_record_id` on the `diagnoses` table. All the data in the column will be lost.
  - You are about to drop the column `deactivated_at` on the `doctors` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `doctors` table. All the data in the column will be lost.
  - You are about to drop the column `schedule_config` on the `doctors` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `doctors` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `doctors` table. All the data in the column will be lost.
  - You are about to drop the column `claim_amount` on the `insurance_claims` table. All the data in the column will be lost.
  - You are about to drop the column `policy_number` on the `insurance_claims` table. All the data in the column will be lost.
  - You are about to drop the column `provider_name` on the `insurance_claims` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `insurance_claims` table. All the data in the column will be lost.
  - You are about to drop the column `appointment_id` on the `medical_records` table. All the data in the column will be lost.
  - You are about to drop the column `clinical_notes` on the `medical_records` table. All the data in the column will be lost.
  - You are about to drop the column `contact_info` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `deactivated_at` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `demographics` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `dob` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `prescriptions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `prescriptions` table. All the data in the column will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `doctors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `patients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scheduled_at` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `record_id` to the `diagnoses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `doctors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `doctors` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `gender` on the `doctors` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `doctor_id` to the `medical_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notes` to the `medical_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date_of_birth` to the `patients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `patients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `patients` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `gender` on the `patients` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "diagnoses" DROP CONSTRAINT "diagnoses_medical_record_id_fkey";

-- DropForeignKey
ALTER TABLE "doctors" DROP CONSTRAINT "doctors_user_id_fkey";

-- DropForeignKey
ALTER TABLE "medical_records" DROP CONSTRAINT "medical_records_appointment_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropForeignKey
ALTER TABLE "patients" DROP CONSTRAINT "patients_user_id_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropIndex
DROP INDEX "doctors_user_id_key";

-- DropIndex
DROP INDEX "medical_records_appointment_id_key";

-- DropIndex
DROP INDEX "patients_user_id_key";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "datetime",
DROP COLUMN "updated_at",
ADD COLUMN     "scheduled_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "diagnoses" DROP COLUMN "code",
DROP COLUMN "medical_record_id",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "record_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "doctors" DROP COLUMN "deactivated_at",
DROP COLUMN "is_active",
DROP COLUMN "schedule_config",
DROP COLUMN "updated_at",
DROP COLUMN "user_id",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
DROP COLUMN "gender",
ADD COLUMN     "gender" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "insurance_claims" DROP COLUMN "claim_amount",
DROP COLUMN "policy_number",
DROP COLUMN "provider_name",
DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "medical_records" DROP COLUMN "appointment_id",
DROP COLUMN "clinical_notes",
ADD COLUMN     "doctor_id" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "contact_info",
DROP COLUMN "deactivated_at",
DROP COLUMN "demographics",
DROP COLUMN "dob",
DROP COLUMN "is_active",
DROP COLUMN "updated_at",
DROP COLUMN "user_id",
ADD COLUMN     "date_of_birth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
DROP COLUMN "gender",
ADD COLUMN     "gender" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "prescriptions" DROP COLUMN "status",
DROP COLUMN "updated_at";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "refresh_tokens";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "Gender";

-- DropEnum
DROP TYPE "NotificationChannel";

-- DropEnum
DROP TYPE "NotificationStatus";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "PrescriptionStatus";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receptionists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receptionists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "receptionists_email_key" ON "receptionists"("email");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_email_key" ON "doctors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_email_key" ON "patients"("email");

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "medical_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
