#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
  wp5) expected_version=7.0.8 ;;
  wp6|wp7|qa) expected_version=7.1.3 ;;
  *) echo "Usage: $0 {wp5|wp6|wp7|qa}" >&2; exit 2 ;;
esac

repo_root=$(cd "$(dirname "$0")/.." && pwd)
cd "$repo_root"

site_dir=".docker-build/wordpress_$1"
if [[ ! -f "$site_dir/wp-includes/version.php" ]]; then
  echo "No existing WordPress installation at $site_dir; run docker compose up -d --build instead." >&2
  exit 1
fi

site_service="wordpress-$1"
db_service="db-$1"
backup_dir=".docker-build/backups/$1-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir"

case "$1" in
  wp5) image=force-refresh-wordpress-wp5:7.0.8 ;;
  wp6) image=wordpress:7.1.3-php8.5-apache@sha256:89e44e84974773a97b5ca5fa21b95377d372956fc9d7d1ad363e9fe062d5fe56 ;;
  *) image=wordpress:7.1.3-php8.3-apache@sha256:e5a724ec7ad9055f48b2941ac1b674b08e77ed60edb8937a6254fb89ec45ddf7 ;;
esac

if [[ "$1" == wp5 ]]; then
  docker compose build --pull "$site_service"
else
  docker compose pull "$site_service"
fi

actual_version=$(docker run --rm --entrypoint php "$image" -r \
  'include "/usr/src/wordpress/wp-includes/version.php"; echo $wp_version;')
if [[ "$actual_version" != "$expected_version" ]]; then
  echo "Image $image contains WordPress $actual_version; expected $expected_version." >&2
  exit 1
fi

docker compose up -d "$db_service"
ready=0
for _ in {1..30}; do
  if docker compose exec -T "$db_service" sh -ec \
    'export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"; mysqladmin --user=root ping --silent' >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done
if [[ "$ready" != 1 ]]; then
  echo "Database $db_service did not become ready." >&2
  exit 1
fi

was_running=0
if [[ -n "$(docker compose ps --status running --quiet "$site_service")" ]]; then
  was_running=1
fi
site_stopped=0
backup_ready=0
sync_complete=0
finish() {
  result=$?
  trap - EXIT
  if [[ "$result" -ne 0 && "$site_stopped" == 1 && "$backup_ready" == 1 && "$sync_complete" == 0 ]]; then
    echo "Core sync failed; restoring the site backup." >&2
    if ! rm -rf "$site_dir/wp-admin" "$site_dir/wp-includes"; then
      echo "Could not clear partial core directories before restore." >&2
      result=1
    fi
    if ! tar -C .docker-build -xzf "$backup_dir/site.tar.gz"; then
      echo "Automatic restore failed; use the backup at $backup_dir." >&2
      result=1
    fi
  fi
  if [[ "$was_running" == 1 && "$site_stopped" == 1 ]]; then
    if ! docker compose up -d "$site_service"; then
      echo "Could not restart $site_service; check the backup at $backup_dir." >&2
      result=1
    fi
  fi
  exit "$result"
}
trap finish EXIT

# Stop the web container while copying core files and taking the site backup.
docker compose stop "$site_service" >/dev/null
site_stopped=1
tar -C .docker-build -czf "$backup_dir/site.tar.gz" "wordpress_$1"
docker compose exec -T "$db_service" sh -ec \
  'export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"; exec mysqldump --user=root --databases "$MYSQL_DATABASE"' \
  > "$backup_dir/database.sql"
test -s "$backup_dir/site.tar.gz"
test -s "$backup_dir/database.sql"
backup_ready=1

docker compose run --rm --no-deps -T --entrypoint bash \
  -e "EXPECTED_VERSION=$expected_version" "$site_service" -c '
    set -euo pipefail
    actual_version=$(php -r "include \"/usr/src/wordpress/wp-includes/version.php\"; echo \$wp_version;")
    test "$actual_version" = "$EXPECTED_VERSION"
    rm -rf /var/www/html/wp-admin /var/www/html/wp-includes
    tar -C /usr/src/wordpress \
      --exclude=./wp-content --exclude=./wp-config.php \
      -cf - . | tar -C /var/www/html -xf -
    installed_version=$(php -r "include \"/var/www/html/wp-includes/version.php\"; echo \$wp_version;")
    test "$installed_version" = "$EXPECTED_VERSION"
  '
sync_complete=1

echo "WordPress $expected_version core copied to $site_dir."
echo "Site and database backups: $backup_dir"
if [[ "$was_running" == 1 ]]; then
  echo "The previously running site will restart automatically."
else
  echo "Start the site with: docker compose up -d $site_service"
fi
