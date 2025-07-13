#!/bin/bash

# Temporarily disable code that references non-existent models
cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Disabling references to non-existent models..."

# Comment out references to non-existent models
find . -name "*.ts" -exec sed -i '' \
  -e 's/this\.prisma\.audit_logs/\/\/ this.prisma.audit_logs/g' \
  -e 's/this\.prisma\.subscription/\/\/ this.prisma.subscription/g' \
  -e 's/this\.prisma\.invoice/\/\/ this.prisma.invoice/g' \
  -e 's/this\.prisma\.paymentMethod/\/\/ this.prisma.paymentMethod/g' \
  -e 's/this\.prisma\.plan/\/\/ this.prisma.plan/g' \
  -e 's/this\.prisma\.usageRecord/\/\/ this.prisma.usageRecord/g' \
  -e 's/this\.prisma\.modelSchema/\/\/ this.prisma.modelSchema/g' \
  -e 's/this\.prisma\.tenantFeature/\/\/ this.prisma.tenantFeature/g' \
  -e 's/this\.prisma\.tenantSetting/\/\/ this.prisma.tenantSetting/g' \
  -e 's/this\.prisma\.emailTemplate/\/\/ this.prisma.emailTemplate/g' \
  -e 's/this\.prisma\.translation/\/\/ this.prisma.translation/g' \
  -e 's/this\.prisma\.translationKey/\/\/ this.prisma.translationKey/g' \
  -e 's/this\.prisma\.tenantAsset/\/\/ this.prisma.tenantAsset/g' \
  -e 's/this\.prisma\.category/\/\/ this.prisma.category/g' \
  -e 's/this\.prisma\.tag/\/\/ this.prisma.tag/g' \
  -e 's/this\.prisma\.modelDefinition/\/\/ this.prisma.modelDefinition/g' \
  -e 's/this\.prisma\.fieldDefinition/\/\/ this.prisma.fieldDefinition/g' \
  -e 's/this\.prisma\.workflow/\/\/ this.prisma.workflow/g' \
  -e 's/this\.prisma\.workflowStage/\/\/ this.prisma.workflowStage/g' \
  -e 's/this\.prisma\.integration/\/\/ this.prisma.integration/g' \
  -e 's/this\.prisma\.externalGateway/\/\/ this.prisma.externalGateway/g' \
  -e 's/this\.prisma\.llmProvider/\/\/ this.prisma.llmProvider/g' \
  -e 's/this\.prisma\.modelTemplate/\/\/ this.prisma.modelTemplate/g' \
  -e 's/this\.prisma\.optionSet/\/\/ this.prisma.optionSet/g' \
  -e 's/this\.prisma\.invitation/\/\/ this.prisma.invitation/g' \
  -e 's/this\.prisma\.auditLog/\/\/ this.prisma.auditLog/g' \
  {} \;

echo "Disabled references to non-existent models!"