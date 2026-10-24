@echo off
REM Lab 7 incident - do not read this file before you have played the challenge!
REM Output stays in English (tooling language of the course). ASCII only: see guidelines.
REM Usage: incident.cmd start | incident.cmd stop
if "%1"=="start" (
  curl -s -o NUL -X POST http://localhost:8082/admin/failure -H "Content-Type: application/json" -d "{\"enabled\": true}"
  echo [incident] something just went wrong... the clock is running.
  goto :eof
)
if "%1"=="stop" (
  curl -s -o NUL -X POST http://localhost:8082/admin/failure -H "Content-Type: application/json" -d "{\"enabled\": false}"
  echo [incident] fixed. Run a control call (expected: 200).
  goto :eof
)
echo Usage: incident.cmd start^|stop
exit /b 2
