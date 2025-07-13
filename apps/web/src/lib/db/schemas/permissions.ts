import { pgTable, serial, varchar, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { roles } from './roles';

export const permissions = pgTable("permissions", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
	roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
	permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
}, (table) => [
	unique("role_permissions_unique").on(table.roleId, table.permissionId),
]);
