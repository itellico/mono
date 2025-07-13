import { relations } from 'drizzle-orm';
import { users } from './users';
import { tenants } from './tenants';

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.uuid],
  }),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
})); 