CREATE TABLE `game_dependencies` (
	`game_id` text NOT NULL,
	`game_version` text NOT NULL,
	`dependency_name` text,
	`dependency_version` text NOT NULL,
	FOREIGN KEY (`game_id`,`game_version`) REFERENCES `game_versions`(`game_id`,`version`) ON UPDATE no action ON DELETE cascade
);
