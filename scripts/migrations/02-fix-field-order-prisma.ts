#!/usr/bin/env tsx

/**
 * Prisma Schema Field Order Fix Script
 * 
 * This script updates the Prisma schema to have correct field ordering.
 * Since PostgreSQL doesn't support column reordering without recreating tables,
 * we fix this at the Prisma schema level.
 * 
 * The correct order is enforced in the schema, and new tables will follow it.
 * Existing tables can be migrated during a maintenance window if needed.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ModelField {
  line: string;
  fieldName: string;
  category: FieldCategory;
  order: number;
}

enum FieldCategory {
  UUID = 1,
  ID = 2,
  FOREIGN_KEY = 3,
  CORE_FIELD = 4,
  STATUS_TYPE = 5,
  CONFIG = 6,
  FLAG = 7,
  AUDIT = 8,
  TIMESTAMP = 9,
  RELATION = 10,
  DIRECTIVE = 11,
  COMMENT = 0
}

const FIELD_PATTERNS = {
  uuid: /^\s*uuid\s+/,
  id: /^\s*id\s+/,
  foreignKey: /^\s*\w+Id\s+/,
  status: /^\s*(status|state|type|tier|level|priority)\s+/,
  config: /^\s*(settings|metadata|config|options|data)\s+/,
  flag: /^\s*is[A-Z]\w*\s+/,
  audit: /^\s*\w+(By|er)\s+/,
  timestamp: /^\s*\w+At\s+/,
  relation: /^\s*\w+\s+(User|Account|Tenant|Role|Permission|Tag|\w+\[\])/,
  directive: /^\s*@@/,
  comment: /^\s*\/\//
};

function categorizeField(line: string): FieldCategory {
  const trimmed = line.trim();
  
  if (!trimmed || FIELD_PATTERNS.comment.test(line)) return FieldCategory.COMMENT;
  if (FIELD_PATTERNS.directive.test(line)) return FieldCategory.DIRECTIVE;
  if (FIELD_PATTERNS.uuid.test(line)) return FieldCategory.UUID;
  if (FIELD_PATTERNS.id.test(line) && !FIELD_PATTERNS.foreignKey.test(line)) return FieldCategory.ID;
  if (FIELD_PATTERNS.relation.test(line)) return FieldCategory.RELATION;
  if (FIELD_PATTERNS.timestamp.test(line)) return FieldCategory.TIMESTAMP;
  if (FIELD_PATTERNS.audit.test(line)) return FieldCategory.AUDIT;
  if (FIELD_PATTERNS.flag.test(line)) return FieldCategory.FLAG;
  if (FIELD_PATTERNS.config.test(line)) return FieldCategory.CONFIG;
  if (FIELD_PATTERNS.status.test(line)) return FieldCategory.STATUS_TYPE;
  if (FIELD_PATTERNS.foreignKey.test(line)) return FieldCategory.FOREIGN_KEY;
  
  return FieldCategory.CORE_FIELD;
}

function extractFieldName(line: string): string {
  const match = line.trim().match(/^(\w+)\s+/);
  return match ? match[1] : '';
}

function sortModelFields(fields: ModelField[]): ModelField[] {
  // Separate different types
  const comments: ModelField[] = [];
  const regularFields: ModelField[] = [];
  const relations: ModelField[] = [];
  const directives: ModelField[] = [];
  
  for (const field of fields) {
    if (field.category === FieldCategory.COMMENT) {
      comments.push(field);
    } else if (field.category === FieldCategory.RELATION) {
      relations.push(field);
    } else if (field.category === FieldCategory.DIRECTIVE) {
      directives.push(field);
    } else {
      regularFields.push(field);
    }
  }
  
  // Sort regular fields by category and name
  regularFields.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category - b.category;
    }
    // Special ordering for specific fields
    const fieldOrder = ['uuid', 'id', 'tenantId', 'accountId', 'userId', 'parentId'];
    const aIndex = fieldOrder.indexOf(a.fieldName);
    const bIndex = fieldOrder.indexOf(b.fieldName);
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    return a.fieldName.localeCompare(b.fieldName);
  });
  
  // Combine in correct order
  return [
    ...comments,
    ...regularFields,
    ...relations,
    ...directives
  ];
}

function processModel(modelContent: string[]): string[] {
  const fields: ModelField[] = [];
  let currentOrder = 0;
  
  // Parse fields
  for (const line of modelContent) {
    const category = categorizeField(line);
    const fieldName = extractFieldName(line);
    
    fields.push({
      line,
      fieldName,
      category,
      order: currentOrder++
    });
  }
  
  // Sort fields
  const sortedFields = sortModelFields(fields);
  
  // Add section comments for clarity
  const result: string[] = [];
  let lastCategory: FieldCategory | null = null;
  
  for (const field of sortedFields) {
    // Add section headers
    if (field.category !== FieldCategory.COMMENT && 
        field.category !== FieldCategory.DIRECTIVE &&
        field.category !== lastCategory) {
      
      const sectionHeaders: Record<FieldCategory, string> = {
        [FieldCategory.UUID]: '  // Identifiers',
        [FieldCategory.ID]: '',
        [FieldCategory.FOREIGN_KEY]: '  // Foreign Keys',
        [FieldCategory.CORE_FIELD]: '  // Core Fields',
        [FieldCategory.STATUS_TYPE]: '  // Status/Type Fields',
        [FieldCategory.CONFIG]: '  // Configuration',
        [FieldCategory.FLAG]: '  // Flags',
        [FieldCategory.AUDIT]: '  // Audit Fields',
        [FieldCategory.TIMESTAMP]: '  // Timestamps',
        [FieldCategory.RELATION]: '  // Relations',
        [FieldCategory.DIRECTIVE]: '  // Indexes and Directives',
        [FieldCategory.COMMENT]: ''
      };
      
      const header = sectionHeaders[field.category];
      if (header && lastCategory !== null) {
        result.push('');
        result.push(header);
      }
      
      lastCategory = field.category;
    }
    
    result.push(field.line);
  }
  
  return result;
}

async function fixPrismaSchema() {
  console.log('🔧 Fixing Prisma Schema Field Order\n');
  
  const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
  const schemaContent = readFileSync(schemaPath, 'utf-8');
  
  // Split into lines
  const lines = schemaContent.split('\n');
  const fixedLines: string[] = [];
  
  let inModel = false;
  let modelLines: string[] = [];
  let modelName = '';
  let modelsFixed = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim().startsWith('model ')) {
      inModel = true;
      modelName = line.trim().split(' ')[1];
      modelLines = [];
      fixedLines.push(line);
      console.log(`Processing model: ${modelName}`);
    } else if (inModel && line.trim() === '}') {
      // Process model fields
      const originalOrder = modelLines.map(l => l.trim()).filter(l => l && !l.startsWith('//'));
      const fixedModel = processModel(modelLines);
      const newOrder = fixedModel.map(l => l.trim()).filter(l => l && !l.startsWith('//'));
      
      // Check if order changed
      const orderChanged = originalOrder.some((field, index) => field !== newOrder[index]);
      
      if (orderChanged) {
        console.log(`  ✅ Fixed field order in ${modelName}`);
        modelsFixed++;
      } else {
        console.log(`  ⏭️  ${modelName} already has correct order`);
      }
      
      fixedLines.push(...fixedModel);
      fixedLines.push(line);
      inModel = false;
      modelLines = [];
    } else if (inModel) {
      modelLines.push(line);
    } else {
      fixedLines.push(line);
    }
  }
  
  // Write fixed schema
  const backupPath = join(process.cwd(), 'prisma', `schema.prisma.backup.${Date.now()}`);
  writeFileSync(backupPath, schemaContent);
  console.log(`\n📄 Backup created: ${backupPath}`);
  
  writeFileSync(schemaPath, fixedLines.join('\n'));
  console.log(`📄 Schema updated: ${schemaPath}`);
  
  console.log(`\n✅ Fixed field order in ${modelsFixed} models`);
  
  console.log('\n📝 Next steps:');
  console.log('1. Review the changes in prisma/schema.prisma');
  console.log('2. Run: pnpm prisma format');
  console.log('3. Run: pnpm prisma validate');
  console.log('4. Generate migration: pnpm prisma migrate dev --name field-order-fix');
}

// Generate field order documentation
function generateFieldOrderDoc() {
  const doc = `# Prisma Schema Field Ordering Rules

## Standard Field Order

All Prisma models must follow this field ordering:

1. **Identifiers**
   - uuid (always first)
   - id (always second)

2. **Foreign Keys** (hierarchical order)
   - tenantId
   - accountId
   - userId
   - parentId
   - Other foreign keys (alphabetical)

3. **Core Fields**
   - name
   - code
   - slug
   - title
   - displayName
   - description
   - Other business fields (alphabetical)

4. **Status/Type Fields**
   - status
   - state
   - type
   - tier
   - level
   - priority

5. **Configuration Fields**
   - settings
   - metadata
   - config
   - options
   - data

6. **Boolean Flags** (is* pattern)
   - isActive
   - isSystem
   - isDefault
   - isPublic
   - Other flags (alphabetical)

7. **Audit Fields** (*By pattern)
   - createdBy
   - updatedBy
   - deletedBy
   - approvedBy
   - Other audit fields

8. **Timestamps** (*At pattern)
   - createdAt (always first timestamp)
   - updatedAt (always second timestamp)
   - deletedAt
   - publishedAt
   - expiresAt
   - Other timestamps (alphabetical)

9. **Relations**
   - Parent relations first
   - Child relations
   - Many-to-many relations

10. **Directives** (@@)
    - @@id
    - @@unique
    - @@index
    - @@map

## Example

\`\`\`prisma
model User {
  // Identifiers
  uuid      String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id        Int      @unique @default(autoincrement())
  
  // Foreign Keys
  tenantId  Int
  accountId Int
  
  // Core Fields
  email     String   @unique
  username  String   @unique
  firstName String
  lastName  String
  
  // Status/Type Fields
  status    UserStatus @default(ACTIVE)
  role      UserRole   @default(USER)
  
  // Configuration
  settings  Json?
  metadata  Json?
  
  // Flags
  isActive  Boolean  @default(true)
  isVerified Boolean @default(false)
  
  // Audit Fields
  createdBy Int?
  updatedBy Int?
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  
  // Relations
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  account   Account  @relation(fields: [accountId], references: [id])
  creator   User?    @relation("UserCreator", fields: [createdBy], references: [id])
  posts     Post[]
  
  // Directives
  @@index([email])
  @@index([tenantId, isActive])
  @@map("users")
}
\`\`\`
`;

  writeFileSync(join(process.cwd(), 'docs', 'database', 'field-ordering-rules.md'), doc);
  console.log('📄 Documentation created: docs/database/field-ordering-rules.md');
}

// Main
async function main() {
  try {
    await fixPrismaSchema();
    generateFieldOrderDoc();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();