#!/usr/bin/env bash
# Starts/stops the EShop SUT (backend + frontend-web + frontend-admin) without Docker.
# frontend-mobile is intentionally NOT started: HW04 §5 excludes Pool D (mobile), and its
# App.js hardcodes the instructor's LAN IP (192.168.10.13) which won't resolve on this machine.
#
# NOTE: backend/database.js re-seeds the whole DB from scratch every time the backend
# process starts (no require.main guard around initDatabase()) — restarting the backend
# wipes any data created via the UI in a previous run (registered users, orders, etc).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUT_DIR="$ROOT_DIR/eshop-sut"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$RUN_DIR/logs"
PID_FILE="$RUN_DIR/pids"

BACKEND_PORT=3000
WEB_PORT=5173
ADMIN_PORT=5174

install_if_needed() {
  local dir="$1"
  if [ ! -d "$dir/node_modules" ]; then
    echo "==> Installing dependencies in ${dir#"$ROOT_DIR"/}"
    (cd "$dir" && npm install)
  fi
}

wait_for() {
  local url="$1" name="$2" tries=30
  until curl -s -o /dev/null "$url"; do
    tries=$((tries - 1))
    if [ "$tries" -le 0 ]; then
      echo "!! $name did not become ready at $url — check $LOG_DIR" >&2
      return 1
    fi
    sleep 1
  done
  echo "==> $name ready at $url"
}

start() {
  if [ ! -d "$SUT_DIR" ]; then
    echo "!! $SUT_DIR not found." >&2
    exit 1
  fi
  if [ -f "$PID_FILE" ]; then
    echo "!! $PID_FILE exists — already running (or stale). Run './run.sh stop' first." >&2
    exit 1
  fi
  mkdir -p "$LOG_DIR"
  : > "$PID_FILE"

  install_if_needed "$SUT_DIR/backend"
  install_if_needed "$SUT_DIR/frontend-web"
  install_if_needed "$SUT_DIR/frontend-admin"

  echo "==> Starting backend on :$BACKEND_PORT (this re-seeds the DB)"
  (cd "$SUT_DIR/backend" && exec node server.js) >"$LOG_DIR/backend.log" 2>&1 &
  echo $! >> "$PID_FILE"

  echo "==> Starting frontend-web on :$WEB_PORT"
  (cd "$SUT_DIR/frontend-web" && exec npm run dev -- --port "$WEB_PORT" --strictPort) >"$LOG_DIR/frontend-web.log" 2>&1 &
  echo $! >> "$PID_FILE"

  echo "==> Starting frontend-admin on :$ADMIN_PORT"
  (cd "$SUT_DIR/frontend-admin" && exec npm run dev -- --port "$ADMIN_PORT" --strictPort) >"$LOG_DIR/frontend-admin.log" 2>&1 &
  echo $! >> "$PID_FILE"

  wait_for "http://localhost:$BACKEND_PORT/api/products" "backend"
  wait_for "http://localhost:$WEB_PORT/" "frontend-web"
  wait_for "http://localhost:$ADMIN_PORT/" "frontend-admin"

  cat <<EOF

EShop SUT is up:
  Backend API     http://localhost:$BACKEND_PORT
  Frontend Web    http://localhost:$WEB_PORT   (FR-04 profile, FR-08 checkout)
  Frontend Admin  http://localhost:$ADMIN_PORT  (FR-15 product CRUD)

  Admin login:  admin@eshop.com / Admin123!
  User login:   test@eshop.com  / Test1234!

Logs:  $LOG_DIR
Stop:  ./run.sh stop
EOF
}

stop() {
  if [ ! -f "$PID_FILE" ]; then
    echo "Nothing to stop (no $PID_FILE)."
    exit 0
  fi
  while read -r pid; do
    [ -n "$pid" ] || continue
    if kill -0 "$pid" 2>/dev/null; then
      echo "==> Stopping PID $pid"
      kill "$pid" 2>/dev/null || true
      # node/vite spawn child processes; on Windows a plain kill often leaves them
      # orphaned holding the port, so also reap the whole tree via taskkill.
      command -v taskkill >/dev/null 2>&1 && taskkill //PID "$pid" //T //F >/dev/null 2>&1 || true
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
  echo "==> Stopped."
}

status() {
  if [ ! -f "$PID_FILE" ]; then
    echo "Not running."
    exit 0
  fi
  while read -r pid; do
    [ -n "$pid" ] || continue
    if kill -0 "$pid" 2>/dev/null; then
      echo "PID $pid: running"
    else
      echo "PID $pid: dead"
    fi
  done < "$PID_FILE"
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  status) status ;;
  *) echo "Usage: $0 [start|stop|status]" >&2; exit 1 ;;
esac
