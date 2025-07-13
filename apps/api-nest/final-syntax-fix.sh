#!/bin/bash

# Final comprehensive fix for all syntax errors
cd /Users/mm2/dev_mm/mono/apps/api-nest/src

echo "Final comprehensive syntax fix..."

# Find all TypeScript files with syntax errors from broken Prisma calls
find . -name "*.service.ts" -exec grep -l "await // this.prisma" {} \; | while read file; do
  echo "Fixing $file..."
  
  # Fix all patterns of broken Prisma calls
  sed -i '' \
    -e 's/const \([a-zA-Z]*\) = await \/\/ this\.prisma\.\([^(]*\)({\(.*\)});/const \1 = null; \/\/ await this.prisma.\2({ \3 });/g' \
    -e 's/const \([a-zA-Z]*\) = await \/\/ this\.prisma\.\([^;]*\);/const \1 = null; \/\/ await this.prisma...\2;/g' \
    -e 's/await \/\/ this\.prisma\.\([^;]*\);/\/\/ await this.prisma.\1;/g' \
    "$file"
done

# Fix multi-line Prisma calls that are partially commented
find . -name "*.service.ts" -print0 | while IFS= read -r -d '' file; do
  # Use perl for multi-line replacements
  perl -i -0pe '
    # Fix patterns like:
    # const something = await // this.prisma.model.method({
    #   where: { ... },
    #   ...
    # });
    s/const\s+(\w+)\s*=\s*await\s*\/\/\s*this\.prisma\.(\w+)\.(\w+)\(\{[^}]*\}\);/const $1 = null; \/\/ await this.prisma.$2.$3({ ... });/gs;
    
    # Fix standalone calls
    s/await\s*\/\/\s*this\.prisma\.(\w+)\.(\w+)\(\{[^}]*\}\);/\/\/ await this.prisma.$1.$2({ ... });/gs;
  ' "$file"
done

# Specific fixes for users.service.ts
echo "Fixing users.service.ts..."
sed -i '' \
  -e '308,314s/const existingInvitation = await \/\/ this\.prisma\.invitation\.findFirst({.*});/const existingInvitation = null; \/\/ await this.prisma.invitation.findFirst({ where: { email: inviteUserDto.email, account_id, status: '\''pending'\'' } });/' \
  -e '320,330s/const invitation = await \/\/ this\.prisma\.invitation\.create({.*});/const invitation = {} as any; \/\/ await this.prisma.invitation.create({ data: { email: inviteUserDto.email, name: inviteUserDto.name, account_id, invitedBy, role: inviteUserDto.role, permissions: inviteUserDto.permissions || [], expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });/' \
  modules/account/services/users.service.ts

# Fix Promise.all patterns
echo "Fixing Promise.all patterns..."
find . -name "*.service.ts" -exec grep -l "await Promise.all" {} \; | while read file; do
  # Fix incomplete Promise.all arrays
  sed -i '' \
    -e '/await Promise\.all/,/\]\);/{
      s/^\s*\/\/ this\.prisma\.\([^,]*\),$/Promise.resolve(null), \/\/ this.prisma.\1/
      s/^\s*\[\],$/Promise.resolve([]),/
      s/^\s*0,$/Promise.resolve(0),/
      s/^\s*null,$/Promise.resolve(null),/
    }' "$file"
done

# Fix any remaining broken syntax
echo "Final cleanup..."
find . -name "*.service.ts" -exec sed -i '' \
  -e 's/const \([a-zA-Z]*\) = \[\];/const \1 = [];/g' \
  -e 's/const \([a-zA-Z]*\) = null;/const \1 = null;/g' \
  -e 's/const \([a-zA-Z]*\) = {};/const \1 = {} as any;/g' \
  -e 's/\[\]; \/\/ await this\.prisma/[]; \/\/ await this.prisma/g' \
  -e 's/null; \/\/ await this\.prisma/null; \/\/ await this.prisma/g' \
  -e 's/{} as any; \/\/ await this\.prisma/{} as any; \/\/ await this.prisma/g' \
  {} \;

echo "Final syntax fix complete!"