/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `bqTableId` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `settings` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Device` table. All the data in the column will be lost.
  - The `status` column on the `Device` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Store` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[deviceId]` on the table `Device` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hardwareId]` on the table `Device` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `actName` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceId` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceStatus` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hardwareId` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hostname` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `version` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wifiConfigs` to the `Device` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "Store_clientId_fkey";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "bqTableId",
DROP COLUMN "settings",
DROP COLUMN "storeId",
DROP COLUMN "updatedAt",
ADD COLUMN     "actName" TEXT NOT NULL,
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "deviceId" TEXT NOT NULL,
ADD COLUMN     "deviceStatus" JSONB NOT NULL,
ADD COLUMN     "hardwareId" TEXT NOT NULL,
ADD COLUMN     "hostname" TEXT NOT NULL,
ADD COLUMN     "installedApps" TEXT[],
ADD COLUMN     "lastPing" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updateBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" TEXT NOT NULL,
ADD COLUMN     "wifiConfigs" JSONB NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'offline';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'CLIENT';

-- DropTable
DROP TABLE "Store";

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_hardwareId_key" ON "Device"("hardwareId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
