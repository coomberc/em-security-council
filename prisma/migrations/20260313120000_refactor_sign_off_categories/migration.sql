-- AlterEnum: Replace old SignOffCategory values with new ones
-- Step 1: Add new enum values
ALTER TYPE "SignOffCategory" ADD VALUE IF NOT EXISTS 'NEW_VENDOR_SUPPLIER';
ALTER TYPE "SignOffCategory" ADD VALUE IF NOT EXISTS 'EXISTING_VENDOR_CHANGE';
ALTER TYPE "SignOffCategory" ADD VALUE IF NOT EXISTS 'AI_ML_USAGE';
ALTER TYPE "SignOffCategory" ADD VALUE IF NOT EXISTS 'DATA_HANDLING_CHANGE';
ALTER TYPE "SignOffCategory" ADD VALUE IF NOT EXISTS 'INFRASTRUCTURE_CHANGE';
ALTER TYPE "SignOffCategory" ADD VALUE IF NOT EXISTS 'NEW_PRODUCT_FEATURE';
ALTER TYPE "SignOffCategory" ADD VALUE IF NOT EXISTS 'INCIDENT_REMEDIATION';

-- Step 2: Migrate existing data to new category values
UPDATE "sign_offs" SET "categories" = array_replace("categories", 'NEW_SUPPLIER_SOFTWARE'::"SignOffCategory", 'NEW_VENDOR_SUPPLIER'::"SignOffCategory");
UPDATE "sign_offs" SET "categories" = array_replace("categories", 'THIRD_PARTY_TOOL'::"SignOffCategory", 'NEW_VENDOR_SUPPLIER'::"SignOffCategory");
UPDATE "sign_offs" SET "categories" = array_replace("categories", 'SCOPE_CHANGE'::"SignOffCategory", 'EXISTING_VENDOR_CHANGE'::"SignOffCategory");
UPDATE "sign_offs" SET "categories" = array_replace("categories", 'NEW_PRODUCT_PLATFORM'::"SignOffCategory", 'NEW_PRODUCT_FEATURE'::"SignOffCategory");
UPDATE "sign_offs" SET "categories" = array_replace("categories", 'SIGNIFICANT_CHANGE'::"SignOffCategory", 'INFRASTRUCTURE_CHANGE'::"SignOffCategory");
UPDATE "sign_offs" SET "categories" = array_replace("categories", 'TECHNICAL_INTEGRATION'::"SignOffCategory", 'INFRASTRUCTURE_CHANGE'::"SignOffCategory");
UPDATE "sign_offs" SET "categories" = array_replace("categories", 'AI_FUNCTIONALITY'::"SignOffCategory", 'AI_ML_USAGE'::"SignOffCategory");
UPDATE "sign_offs" SET "categories" = array_replace("categories", 'DATA_SECURITY_IMPACT'::"SignOffCategory", 'DATA_HANDLING_CHANGE'::"SignOffCategory");

-- Step 3: Recreate enum without old values
-- PostgreSQL doesn't support DROP VALUE from enums, so we recreate the type
ALTER TYPE "SignOffCategory" RENAME TO "SignOffCategory_old";

CREATE TYPE "SignOffCategory" AS ENUM ('NEW_VENDOR_SUPPLIER', 'EXISTING_VENDOR_CHANGE', 'AI_ML_USAGE', 'DATA_HANDLING_CHANGE', 'INFRASTRUCTURE_CHANGE', 'NEW_PRODUCT_FEATURE', 'INCIDENT_REMEDIATION', 'OTHER');

-- Step 4: Update the column to use the new enum type
ALTER TABLE "sign_offs" ALTER COLUMN "categories" TYPE "SignOffCategory"[] USING ("categories"::text[]::"SignOffCategory"[]);

-- Step 5: Drop the old enum type
DROP TYPE "SignOffCategory_old";
