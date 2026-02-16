-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "situations" (
    "id" TEXT NOT NULL,
    "elderName" TEXT NOT NULL,
    "elderAge" INTEGER,
    "elderDob" TIMESTAMP(3),
    "elderLocation" JSONB,
    "currentLivingSituation" TEXT,
    "cognitiveStatus" TEXT,
    "mobilityStatus" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'preparedness',
    "crisisActivatedAt" TIMESTAMP(3),
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "readinessByDomain" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "situations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "situation_members" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "location" TEXT,
    "authorizationTier" TEXT NOT NULL DEFAULT 'standard',
    "role" TEXT,
    "contactInfo" JSONB,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "situation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_conditions" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diagnosisDate" TIMESTAMP(3),
    "severity" TEXT,
    "trajectory" TEXT,
    "notes" TEXT,

    CONSTRAINT "medical_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "prescriber" TEXT,
    "purpose" TEXT,
    "interactions" TEXT[],

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT,
    "contactInfo" JSONB,
    "nextAppointment" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_profile" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "incomeSources" JSONB,
    "assets" JSONB,
    "monthlyExpenses" JSONB,
    "insurancePolicies" JSONB,
    "homeValue" DECIMAL(65,30),
    "homeOwned" BOOLEAN,
    "projectedMonthlyGap" DECIMAL(65,30),
    "projectedRunwayMonths" INTEGER,
    "medicaidEligibleDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "exists" BOOLEAN NOT NULL DEFAULT false,
    "holder" TEXT,
    "dateExecuted" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3),
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'missing',
    "notes" TEXT,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing_assessment" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "homeType" TEXT,
    "floors" INTEGER,
    "accessibilityScore" INTEGER,
    "safetyItems" JSONB,
    "modificationNeeded" BOOLEAN,
    "modificationEstimate" DECIMAL(65,30),
    "modificationItems" TEXT[],
    "alternativesResearched" JSONB,
    "riskLevel" TEXT,

    CONSTRAINT "housing_assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_scenarios" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scenarioType" TEXT NOT NULL,
    "monthlyCost" DECIMAL(65,30),
    "financialRunwayMonths" INTEGER,
    "costBreakdown" JSONB,
    "pros" TEXT[],
    "cons" TEXT[],
    "financialModel" JSONB,
    "assumptions" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "domain" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "situationId" TEXT,
    "userId" TEXT NOT NULL,
    "conversationType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "agentType" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'informational',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recommendedAction" TEXT,
    "financialImpact" DECIMAL(65,30),
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSizeBytes" INTEGER,
    "documentType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "storagePath" TEXT,
    "extractedData" JSONB,
    "confirmedData" JSONB,
    "confidence" DOUBLE PRECISION,
    "extractionModel" TEXT,
    "errorMessage" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readiness_history" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "byDomain" JSONB,
    "gaps" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readiness_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "financial_profile_situationId_key" ON "financial_profile"("situationId");

-- CreateIndex
CREATE UNIQUE INDEX "housing_assessment_situationId_key" ON "housing_assessment"("situationId");

-- CreateIndex
CREATE INDEX "documents_situationId_idx" ON "documents"("situationId");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- AddForeignKey
ALTER TABLE "situations" ADD CONSTRAINT "situations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "situation_members" ADD CONSTRAINT "situation_members_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "situation_members" ADD CONSTRAINT "situation_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_conditions" ADD CONSTRAINT "medical_conditions_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_profile" ADD CONSTRAINT "financial_profile_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing_assessment" ADD CONSTRAINT "housing_assessment_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_scenarios" ADD CONSTRAINT "care_scenarios_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "situation_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledgedBy_fkey" FOREIGN KEY ("acknowledgedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readiness_history" ADD CONSTRAINT "readiness_history_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "situations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

