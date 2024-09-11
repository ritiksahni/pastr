CREATE TABLE `pastr_files` (
	`id` text PRIMARY KEY NOT NULL,
	`file_content` blob NOT NULL,
	`created_at` integer DEFAULT strftime('%s', 'now') NOT NULL
);
