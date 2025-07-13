#!/bin/bash

# Fix all remaining syntax errors
cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Fixing remaining syntax errors..."

# Fix tenant.service.ts
echo "Fixing tenant.service.ts..."
cat > /tmp/tenant-fix.txt << 'EOF'
    // Get all accounts for this tenant first
    const accounts = await this.prisma.account.findMany({
      where: { tenant_id: parseInt(tenant_id) },
      select: { id: true },
    });
    
    const accountIds = accounts.map(a => a.id);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { account_id: { in: accountIds } },
        skip,
        take: limit,
        include: {
          account: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.user.count({
        where: { account_id: { in: accountIds } },
      }),
    ]);
EOF

# Apply the fix to tenant.service.ts
perl -i -pe 'BEGIN{$/=undef; $replacement=`cat /tmp/tenant-fix.txt`} s/\/\/ Get all accounts for this tenant first.*?\]\);/$replacement/s' modules/tenant/tenant.service.ts

# Fix other broken Promise.resolve patterns
echo "Fixing broken Promise.resolve patterns..."
find . -name "*.service.ts" -exec sed -i '' \
  -e '/Promise\.resolve(0),$/,/\]\);/s/Promise\.resolve(0),.*\]\);/]);/s' \
  -e 's/^\s*Promise\.resolve(0),$/      Promise.resolve(0),/g' \
  {} \;

# Clean up any standalone Promise.resolve lines
sed -i '' '/^[[:space:]]*Promise\.resolve(0),[[:space:]]*$/d' modules/tenant/tenant.service.ts

# Fix metadata for tenant service (around line 135-141)
echo "Fixing tenant service metadata calculations..."
sed -i '' \
  -e '135,141d' \
  modules/tenant/tenant.service.ts

# Insert proper metadata calculation
sed -i '' \
  -e '/const totalUserCount = users.length;/a\
\
    const metadata = {\
      totalAccounts: accounts.length,\
      totalUsers: users.length,\
      activeUsers: users.filter(u => u.is_active).length,\
      lastActivity: new Date().toISOString(),\
    };' \
  modules/tenant/tenant.service.ts

echo "Remaining errors fixed!"