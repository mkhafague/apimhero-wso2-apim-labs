#!/usr/bin/env bash
# Lab 7 incident - do not read this file before you have played the challenge!
# Output stays in English (tooling language of the course).
# Usage: ./incident.sh start | ./incident.sh stop
set -euo pipefail
case "${1:-}" in
  start)
    curl -s -o /dev/null -X POST http://localhost:8082/admin/failure -H "Content-Type: application/json" -d "{\"enabled\": true}"
    echo "[incident] something just went wrong... the clock is running."
    ;;
  stop)
    curl -s -o /dev/null -X POST http://localhost:8082/admin/failure -H "Content-Type: application/json" -d "{\"enabled\": false}"
    echo "[incident] fixed. Run a control call (expected: 200)."
    ;;
  *)
    echo "Usage: $0 start|stop" >&2
    exit 2
    ;;
esac
