#!/bin/sh
set -eu
umask 077

root=${FLAMBOYAN_ROOT:-"$HOME/flamboyan"}
php_bin=${HOSTINGER_PHP_BIN:-/opt/alt/php84/usr/bin/php}
repo_url=https://github.com/ariefmavlana/flamboyan-perum.git
case "$root" in /*) ;; *) exit 64 ;; esac
test -d "$root/shared"
test -L "$root/current"
test -r "$root/shared/.env"
exec 9>"$root/shared/deploy-api.lock"
/usr/bin/flock -n -E 75 9

export GIT_TERMINAL_PROMPT=0
export COMPOSER_MEMORY_LIMIT=512M
repo="$root/source.git"
if [ ! -e "$repo" ]; then
  git init --bare -q "$repo"
  git -C "$repo" remote add origin "$repo_url"
fi
test "$(git -C "$repo" remote get-url origin)" = "$repo_url"
git -c http.sslVerify=true -C "$repo" fetch --quiet --no-tags origin '+refs/heads/main:refs/remotes/origin/main'
sha=$(git -C "$repo" rev-parse --verify refs/remotes/origin/main^{commit})
old_target=$(readlink "$root/current")
old_sha=${old_target#releases/}
for value in "$sha" "$old_sha"; do
  test "${#value}" -eq 40
  case "$value" in *[!0-9a-f]*) exit 65 ;; esac
done
test "$old_target" = "releases/$old_sha"
if [ "$sha" = "$old_sha" ]; then
  printf 'API already current: %s\n' "$sha"
  exit 0
fi
# A force push or rollback requires an operator, not automatic promotion.
git -C "$repo" merge-base --is-ancestor "$old_sha" "$sha"
# Shared queue workers are copied by an operator; never promote across drift.
for bootstrap in queue-cron.sh queue-worker.php; do
  expected=$(git -C "$repo" show "$sha:ops/hostinger/$bootstrap" | sha256sum | cut -d ' ' -f 1)
  actual=$(sha256sum "$root/shared/$bootstrap" | cut -d ' ' -f 1)
  test "$expected" = "$actual"
done
# At most current + rollback + one candidate (including failed candidates).
# Recovery of a failed candidate requires an operator, rather than disk growth.
test "$(find "$root/releases" -mindepth 1 -maxdepth 1 | wc -l)" -lt 3
final="$root/releases/$sha"
test ! -e "$final"
# Retain at most one failed staging tree per SHA; minute retries must not fill disk.
stage="$root/releases/.staging-$sha"
test ! -e "$stage"
mkdir "$stage"
archive="$stage/source.tar"
git -C "$repo" archive --format=tar --output="$archive" "$sha" apps/api ops/hostinger
tar -xf "$archive" -C "$stage"
test -z "$(find "$stage/apps/api" "$stage/ops/hostinger" -type l -print)"
test ! -e "$stage/apps/api/.env"
test -f "$stage/apps/api/composer.lock"
ln -s "$root/shared/.env" "$stage/apps/api/.env"
mv "$stage/apps/api/storage" "$stage/apps/api/storage.source"
ln -s "$root/shared/storage" "$stage/apps/api/storage"
composer_bin=${HOSTINGER_COMPOSER_BIN:-$(command -v composer)}
cd "$stage/apps/api"
lock_before=$(sha256sum composer.lock)
"$php_bin" -d memory_limit=512M "$composer_bin" install --no-dev --prefer-dist --optimize-autoloader --no-plugins --no-scripts --no-interaction --no-progress
test "$lock_before" = "$(sha256sum composer.lock)"
"$php_bin" artisan package:discover --no-ansi
# Keep staging paths valid until after readiness: cache is created after rename.
FLAMBOYAN_ROOT="$root" "$php_bin" "$stage/ops/hostinger/check-api.php" "$stage/apps/api" > "$stage/release-check.json"
mv "$stage" "$final"
cd "$final/apps/api"
"$php_bin" artisan config:cache --no-ansi
"$php_bin" artisan route:cache --no-ansi
FLAMBOYAN_ROOT="$root" "$php_bin" "$final/ops/hostinger/check-api.php" "$final/apps/api" > "$final/release-check.json"
test "$(readlink "$root/current")" = "$old_target"
pointer="$root/.current-$sha-$$"
ln -s "releases/$sha" "$pointer"
mv -Tf "$pointer" "$root/current"
printf '{"sha":"%s","previous_sha":"%s","promoted_at":"%s"}\n' "$sha" "$old_sha" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$root/shared/api-release-status.json.next"
mv -f "$root/shared/api-release-status.json.next" "$root/shared/api-release-status.json"
printf 'API promoted: %s (previous %s)\n' "$sha" "$old_sha"
# The deploy lock is still held. Keep exactly the active and rollback releases.
for obsolete in "$root/releases/"*; do
  name=${obsolete##*/}
  test "${#name}" -eq 40 || continue
  case "$name" in *[!0-9a-f]*) continue ;; esac
  [ "$name" != "$sha" ] && [ "$name" != "$old_sha" ] || continue
  test ! -L "$obsolete"
  test "$(readlink -f "$obsolete")" = "$root/releases/$name"
  rm -rf -- "$obsolete"
done
