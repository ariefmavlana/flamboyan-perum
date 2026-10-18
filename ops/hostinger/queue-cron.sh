#!/bin/sh
set -eu
umask 077
queue=${1-}
case "$queue" in notifications|media|default) ;; *) exit 64 ;; esac
root=${FLAMBOYAN_ROOT:-"$HOME/flamboyan"}
php_bin=${HOSTINGER_PHP_BIN:-/opt/alt/php84/usr/bin/php}
case "$root" in /*) ;; *) exit 64 ;; esac
test -d "$root/shared"
export FLAMBOYAN_ROOT="$root"
exec /usr/bin/flock -n -E 75 "$root/shared/queue-$queue.lock" \
  /usr/bin/timeout --kill-after=10s 120s \
  "$php_bin" -d memory_limit=512M "$root/shared/queue-worker.php" "$queue" \
  >> "$root/shared/queue-$queue.log" 2>&1
