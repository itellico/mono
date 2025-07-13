#!/bin/bash

# Fix syntax errors from disable-missing-models script
cd /Users/mm2/dev_mm/mono/apps/api-nest/src/modules/platform/services

echo "Fixing syntax errors in tenants.service.ts..."

# Fix the modelSchema.count call
sed -i '' \
  -e '345,347s/\/\/ this.prisma.modelSchema.count({.*where: { tenant_id },.*}),/0,/' \
  tenants.service.ts

# Fix the usageRecord.findMany call
sed -i '' \
  -e '396,399s/const usage = await \/\/ this.prisma.usageRecord.findMany({.*where,.*orderBy: { recordedAt: '\''desc'\'' },.*});/const usage = [];/' \
  tenants.service.ts

# Fix the plan.findUnique call
sed -i '' \
  -e '448,450s/const plan = await \/\/ this.prisma.plan.findUnique({.*where: { id: data.planId },.*});/const plan = null;/' \
  tenants.service.ts

# Fix the tenantFeature.create call
sed -i '' \
  -e '510,516s/await \/\/ this.prisma.tenantFeature.create({.*data: {.*tenant_id,.*featureId,.*enabledBy: '\''platform'\'',.*},.*});/\/\/ await this.prisma.tenantFeature.create({ data: { tenant_id, featureId, enabledBy: '\''platform'\'' } });/' \
  tenants.service.ts

# Fix the tenantFeature.deleteMany call
sed -i '' \
  -e '530,535s/await \/\/ this.prisma.tenantFeature.deleteMany({.*where: {.*tenant_id,.*featureId,.*},.*});/\/\/ await this.prisma.tenantFeature.deleteMany({ where: { tenant_id, featureId } });/' \
  tenants.service.ts

echo "Syntax fixes complete!"