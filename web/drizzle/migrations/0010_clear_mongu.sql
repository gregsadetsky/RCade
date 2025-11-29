CREATE TABLE `plugin_authors` (
	`plugin_id` text NOT NULL,
	`plugin_version` text NOT NULL,
	`recurse_id` integer,
	`display_name` text NOT NULL,
	FOREIGN KEY (`plugin_id`,`plugin_version`) REFERENCES `plugin_versions`(`plugin_id`,`version`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plugin_versions` (
	`plugin_id` text NOT NULL,
	`display_name` text,
	`description` text NOT NULL,
	`visibility` text NOT NULL,
	`version` text NOT NULL,
	FOREIGN KEY (`plugin_id`) REFERENCES `plugins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plugin_versions_plugin_id_version_unique` ON `plugin_versions` (`plugin_id`,`version`);--> statement-breakpoint
CREATE TABLE `plugins` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`github_author` text NOT NULL,
	`github_repo` text NOT NULL,
	`owner_rc_id` numeric NOT NULL
);
