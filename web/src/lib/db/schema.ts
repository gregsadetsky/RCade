import { relations } from 'drizzle-orm';
import { integer, numeric, sqliteTable, text, unique, foreignKey } from 'drizzle-orm/sqlite-core';

/// Categories

export const categories = sqliteTable('categories', {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
});

/// Games

export const games = sqliteTable('games', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    github_author: text("github_author").notNull(),
    github_repo: text("github_repo").notNull(),
    owner_rc_id: numeric("owner_rc_id").notNull(),
});

export const gameVersions = sqliteTable('game_versions', {
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    description: text("description").notNull(),
    visibility: text("visibility", { enum: ["public", "internal", "private"] }).notNull(),
    version: text("version").notNull(),
}, (t) => [
    unique().on(t.gameId, t.version),
]);

export const gameVersionCategories = sqliteTable('game_version_categories', {
    gameId: text("game_id").notNull(),
    gameVersion: text("game_version").notNull(),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (t) => [
    foreignKey({
        columns: [t.gameId, t.gameVersion],
        foreignColumns: [gameVersions.gameId, gameVersions.version],
    }).onDelete("cascade"),
    unique().on(t.gameId, t.gameVersion, t.categoryId),
]);

export const gameDependencies = sqliteTable('game_dependencies', {
    gameId: text("game_id").notNull(),
    gameVersion: text("game_version").notNull(),
    dependencyName: text("dependency_name"),
    dependencyVersion: text("dependency_version").notNull(),
}, (t) => [
    foreignKey({
        columns: [t.gameId, t.gameVersion],
        foreignColumns: [gameVersions.gameId, gameVersions.version],
    }).onDelete("cascade"),
]);

export const gameAuthors = sqliteTable('game_authors', {
    gameId: text("game_id").notNull(),
    gameVersion: text("game_version").notNull(),
    recurse_id: integer("recurse_id"),
    display_name: text("display_name").notNull(),
}, (t) => [
    foreignKey({
        columns: [t.gameId, t.gameVersion],
        foreignColumns: [gameVersions.gameId, gameVersions.version],
    }).onDelete("cascade"),
]);

export const categoriesRelations = relations(categories, ({ many }) => ({
    gameVersionCategories: many(gameVersionCategories),
}));

export const gamesRelations = relations(games, ({ many }) => ({
    versions: many(gameVersions),
}));

export const gameVersionCategoriesRelations = relations(gameVersionCategories, ({ one }) => ({
    gameVersion: one(gameVersions, {
        fields: [gameVersionCategories.gameId, gameVersionCategories.gameVersion],
        references: [gameVersions.gameId, gameVersions.version],
    }),
    category: one(categories, {
        fields: [gameVersionCategories.categoryId],
        references: [categories.id],
    }),
}));

export const gameAuthorsRelations = relations(gameAuthors, ({ one }) => ({
    gameVersion: one(gameVersions, {
        fields: [gameAuthors.gameId, gameAuthors.gameVersion],
        references: [gameVersions.gameId, gameVersions.version],
    }),
}));

export const gameDependenciesRelations = relations(gameDependencies, ({ one }) => ({
    gameVersion: one(gameVersions, {
        fields: [gameDependencies.gameId, gameDependencies.gameVersion],
        references: [gameVersions.gameId, gameVersions.version],
    }),
}));

export const gameVersionsRelations = relations(gameVersions, ({ many, one }) => ({
    authors: many(gameAuthors),
    dependencies: many(gameDependencies),
    categories: many(gameVersionCategories),
    game: one(games, {
        fields: [gameVersions.gameId],
        references: [games.id],
    }),
}));

/// Plugins

export const plugins = sqliteTable('plugins', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    github_author: text("github_author").notNull(),
    github_repo: text("github_repo").notNull(),
    owner_rc_id: numeric("owner_rc_id").notNull(),
});

export const pluginVersions = sqliteTable('plugin_versions', {
    pluginId: text("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    description: text("description").notNull(),
    visibility: text("visibility", { enum: ["public", "internal", "private"] }).notNull(),
    version: text("version").notNull(),
}, (t) => [
    unique().on(t.pluginId, t.version),
]);

export const pluginAuthors = sqliteTable('plugin_authors', {
    pluginId: text("plugin_id").notNull(),
    pluginVersion: text("plugin_version").notNull(),
    recurse_id: integer("recurse_id"),
    display_name: text("display_name").notNull(),
}, (t) => [
    foreignKey({
        columns: [t.pluginId, t.pluginVersion],
        foreignColumns: [pluginVersions.pluginId, pluginVersions.version],
    }).onDelete("cascade"),
]);

export const pluginsRelations = relations(plugins, ({ many }) => ({
    versions: many(pluginVersions),
}));

export const pluginAuthorsRelations = relations(pluginAuthors, ({ one }) => ({
    pluginVersion: one(pluginVersions, {
        fields: [pluginAuthors.pluginId, pluginAuthors.pluginVersion],
        references: [pluginVersions.pluginId, pluginVersions.version],
    }),
}));

export const pluginVersionsRelations = relations(pluginVersions, ({ many, one }) => ({
    authors: many(pluginAuthors),
    plugin: one(plugins, {
        fields: [pluginVersions.pluginId],
        references: [plugins.id],
    }),
}));
