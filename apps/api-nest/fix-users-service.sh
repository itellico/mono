#!/bin/bash

# Fix users.service.ts to use proper Prisma relations
cd /Users/mm2/dev_mm/mono/apps/api-nest/src/modules/account/services

echo "Fixing users.service.ts..."

# Create backup
cp users.service.ts users.service.ts.bak

# Fix the service
cat > /tmp/users-fixes.sed << 'EOF'
# Fix getAccountUsers - users belong to accounts directly
s/accounts: {/account: {/g
s/some: { account_id }/id: parseInt(accountId)/g
s/user\.accounts\[0\]/user.account/g
s/user\.accountUsers\??\.\[0\]\??\.role/user.account_role/g
s/user\.accountUsers\??\.\[0\]\??\.joinedAt/user.created_at/g

# Fix the select statement to get user fields
/select: {/,/},/ {
  s/name: true,/first_name: true,\n          last_name: true,/
}

# Fix mapping in getAccountUsers
s/name: \`\${user\.first_name} \${user\.last_name}\`,/name: user.first_name + ' ' + user.last_name,/
s/email: user\.account\??\.email,/email: user.account.email,/

# Fix getAccountUser
s/id: parseInt(user_id),/id: parseInt(user_id),/
s/accounts: {/account: {/g
s/user\.accountUsers\??\.\[0\]\??\.permissions/\[\]/g

# Fix createAccountUser - change accounts to account
s/accounts: {/account: {/g
s/create: {$/connect: {/g
s/account_id,/id: parseInt(accountId),/g

# Fix userId fields
s/user_id: existingUser\.id,/userId: existingUser.id,/g
s/userId: user_id,/userId: parseInt(user_id),/g
s/userId: updatePermissionsDto\.user_id,/userId: parseInt(updatePermissionsDto.user_id),/g

# Remove accountUsers references
s/accountUsers/account/g

# Fix account_id usage
s/account_id: parseInt(accountId),/accountId: parseInt(accountId),/g
EOF

# Apply the fixes
sed -i '' -f /tmp/users-fixes.sed users.service.ts

# Additional fixes for complex patterns
perl -i -pe '
  # Fix the name mapping
  s/name: `\$\{user\.first_name\} \$\{user\.last_name\}`/name: (user.first_name || "") + " " + (user.last_name || "")/g;
  
  # Fix role and permissions mapping
  s/role: user\.account\??\.role,/role: user.account_role,/g;
  s/permissions: user\.account\??\.permissions \|\| \[\],/permissions: [],/g;
' users.service.ts

# Fix the where clause for users filtering by account
perl -i -0pe '
  s/const where: any = \{\s*account: \{\s*some: \{\s*accountId: parseInt\(accountId\)\s*\}\s*\}\s*\}/const where: any = {\n      account_id: parseInt(accountId)\n    }/gs;
' users.service.ts

# Fix user creation data structure
perl -i -0pe '
  s/data: \{\s*email: createUserDto\.email,\s*name: createUserDto\.name,\s*password: temporaryPassword.*?\s*account: \{\s*create: \{.*?\}\s*\}\s*\}/data: {\n        email: createUserDto.email,\n        first_name: createUserDto.name.split(" ")[0] || createUserDto.name,\n        last_name: createUserDto.name.split(" ")[1] || "",\n        username: createUserDto.email.split("@")[0],\n        account_id: parseInt(accountId),\n        account_role: createUserDto.role\n      }/gs;
' users.service.ts

echo "Users service fixes complete!"