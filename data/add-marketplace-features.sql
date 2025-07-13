-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "EntityTag" DROP CONSTRAINT "EntityTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "EntityTag" DROP CONSTRAINT "EntityTag_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "EntityTag" DROP CONSTRAINT "EntityTag_addedBy_fkey";

-- DropForeignKey
ALTER TABLE "UserCollection" DROP CONSTRAINT "UserCollection_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserCollection" DROP CONSTRAINT "UserCollection_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionItem" DROP CONSTRAINT "CollectionItem_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "JobPosting" DROP CONSTRAINT "JobPosting_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "JobPosting" DROP CONSTRAINT "JobPosting_postedById_fkey";

-- DropForeignKey
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_applicantId_fkey";

-- DropForeignKey
ALTER TABLE "GigOffering" DROP CONSTRAINT "GigOffering_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "GigOffering" DROP CONSTRAINT "GigOffering_talentId_fkey";

-- DropForeignKey
ALTER TABLE "GigBooking" DROP CONSTRAINT "GigBooking_gigId_fkey";

-- DropForeignKey
ALTER TABLE "GigBooking" DROP CONSTRAINT "GigBooking_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_gigId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_jobId_fkey";

-- DropForeignKey
ALTER TABLE "ConversationParticipant" DROP CONSTRAINT "ConversationParticipant_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "ConversationParticipant" DROP CONSTRAINT "ConversationParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_jobApplicationId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_gigBookingId_fkey";

-- DropForeignKey
ALTER TABLE "MessageAttachment" DROP CONSTRAINT "MessageAttachment_messageId_fkey";

-- DropForeignKey
ALTER TABLE "MessageAttachment" DROP CONSTRAINT "MessageAttachment_previousVersionId_fkey";

-- DropIndex
DROP INDEX "Tag_uuid_key";

-- DropIndex
DROP INDEX "Tag_tenantId_category_idx";

-- DropIndex
DROP INDEX "Tag_usageCount_idx";

-- DropIndex
DROP INDEX "Tag_tenantId_slug_key";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "category",
DROP COLUMN "createdBy",
DROP COLUMN "isSystem",
DROP COLUMN "tenantId",
DROP COLUMN "usageCount";

-- DropTable
DROP TABLE "EntityTag";

-- DropTable
DROP TABLE "UserCollection";

-- DropTable
DROP TABLE "CollectionItem";

-- DropTable
DROP TABLE "JobPosting";

-- DropTable
DROP TABLE "JobApplication";

-- DropTable
DROP TABLE "GigOffering";

-- DropTable
DROP TABLE "GigBooking";

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "ConversationParticipant";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "MessageAttachment";

-- DropEnum
DROP TYPE "MessageContext";

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug" ASC);

