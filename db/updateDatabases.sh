#!/bin/bash
set -e

MYSQL_USER="force-refresh-dev-user"
MYSQL_PASSWORD="force-refresh-dev-password"
MYSQL_DB="force-refresh-dev-db"

# Format: "container:output_path"
DATABASES=(
  "force-refresh-db-dev-container-wp-6:db/wp-6/force-refesh-dev-database-wp-6.sql"
  "force-refresh-db-dev-container-wp-6-3:db/wp-6-3/force-refresh-dev-database-wp-6-3.sql"
  "force-refresh-db-dev-container-wp-qa:db/wp-qa/force-refresh-dev-database-wp-qa.sql"
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
