# Local WordPress Docker images

The Compose matrix uses WordPress 5.9.19 on PHP 7.4, WordPress 6.9.10 on PHP 8.3, and WordPress 7.1.3 on PHP 8.3 for both WP7 and QA. The 5.9 and 6.9 images build from Docker Official WordPress images with the official WordPress release archives and published SHA-1 checksums. Docker does not publish image tags for those newer legacy-branch patches. The WP5 image uses the final official PHP 7.4 image; PHP 7.4 itself is end of life, so this service remains a legacy compatibility target.

For a new checkout, run `docker compose up -d --build`. The official image entrypoint copies the bundled core into each empty `.docker-build/wordpress_*` directory.

Existing `.docker-build/wordpress_*` directories already contain core files. Docker does not overwrite those files when an image changes. To update one existing local installation, run `bash docker/sync-wordpress-core.sh wp5`, `wp6`, `wp7`, or `qa`. The command refreshes the image, starts its database, stops its web container, and backs up the entire site directory and a database dump under `.docker-build/backups/`. It then replaces `wp-admin` and `wp-includes` and copies the selected release's remaining core files. It preserves `wp-content`, `wp-config.php`, and the database. A previously running site restarts automatically; otherwise, the script prints a start command. WordPress may prompt for a database update after a major-version upgrade.

The sync command is opt-in. Running `docker compose up -d --build` alone does not update an existing installation's core files.

The other Compose services are unchanged: Traefik remains at 2.1.3, MariaDB at 10.3, and Mailpit at `latest`. [Traefik's support table](https://doc.traefik.io/traefik/deprecation/releases/) and [MariaDB's maintenance table](https://mariadb.org/about/) show that the pinned Traefik and MariaDB lines are out of support. Moving MariaDB to a newer major version requires a separate data migration and compatibility check for the existing bind-mounted databases.

Release versions and archive checksums: [WordPress release archive](https://wordpress.org/download/releases/). Available image tags: [Docker Official WordPress image](https://hub.docker.com/_/wordpress).
