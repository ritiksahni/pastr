CREATE TABLE `pastr_files` (
	`id` text PRIMARY KEY NOT NULL,
	`file_content` blob NOT NULL,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
