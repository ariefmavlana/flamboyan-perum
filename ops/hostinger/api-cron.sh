#!/bin/sh
set -eu
umask 077
root=${FLAMBOYAN_ROOT:-"$HOME/flamboyan"}
case "$root" in /*) ;; *) exit 64 ;; esac
test -d "$root/shared"
export FLAMBOYAN_ROOT="$root"
# Serialize before opening the bounded latest-run log.
exec 8>"$root/shared/api-cron.lock"
/usr/bin/flock -n -E 75 8
exec /usr/bin/timeout --kill-after=10s 240s /bin/sh "$root/shared/deploy-api.sh" \
  > "$root/shared/deploy-api.log" 2>&1
