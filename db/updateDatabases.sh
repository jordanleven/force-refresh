#!/bin/bash
set -e

MYSQL_USER="force-refresh-dev-user"
MYSQL_PASSWORD="force-refresh-dev-password"
MYSQL_DB="force-refresh-dev-db"

# Format: "container:output_path"
DATABASES=(
  "force-refresh-db-dev-container-wp-4:db/wp-4/force-refresh-dev-database-wp-4.sql"
  "force-refresh-db-dev-container-wp-5:db/wp-5/force-refresh-dev-database-wp-5.sql"
  "force-refresh-db-dev-container-wp-6:db/wp-6/force-refresh-dev-database-wp-6.sql"
  "force-refresh-db-dev-container-wp-7:db/wp-7/force-refresh-dev-database-wp-7.sql"
)

YELLOW='\033[0;33m'
GREEN='\033[0;32m'
RESET='\033[0m'

dump() {
  local container="$1"
  local output="$2"
  echo -e "${YELLOW}Dumping $container → $output${RESET}"
  docker exec "$container" mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DB" > "$output"
}

for entry in "${DATABASES[@]}"; do
  dump "${entry%%:*}" "${entry##*:}"
done

echo -e "\n${GREEN}Completed ${#DATABASES[@]} database dumps.${RESET}"
