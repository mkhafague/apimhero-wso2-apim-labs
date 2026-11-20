# Lab 2 — Publish your first API (Petstore) — commands

> Copy-paste cheat sheet. Explanations, expected results and the incident are in the lab sheet.

## Step 1 — Backend first

```bash
docker compose --profile core --profile apps up -d
docker compose ps
```

```bash
curl -s -i http://localhost:8081/health
curl -s -i http://localhost:8081/pets
# the response is taller than your screen? read it page by page (q to quit):
curl -s -i http://localhost:8081/pets | less
```

```bash
curl -s http://localhost:8081/pets/6
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/pets/99
curl -s -X POST http://localhost:8081/pets -H "Content-Type: application/json" -d @payloads/new-pet.json
curl -s -X POST http://localhost:8081/pets -H "Content-Type: application/json" -d @payloads/bad-pet.json
```

## Step 4 — The incident (do not skip it!)

### 4.2 — Trigger the failure

```bash
docker compose stop petstore
```

```bash
docker compose ps -a
```

```bash
docker compose start petstore
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/health
```

## Step 5 — Check the default security *(optional, prepares lab 3)*

```bash
curl -k -s -i https://localhost:8243/petstore/1.0.0/pets
```

## Simulated failure (going further)

```bash
curl -s -X POST http://localhost:8081/admin/failure -H "Content-Type: application/json" -d @payloads/failure-on.json
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/pets
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/health
curl -s -X POST http://localhost:8081/admin/failure -H "Content-Type: application/json" -d @payloads/failure-off.json
```

## Cleanup

```bash
docker compose --profile core --profile apps stop
docker compose ps -a      # the containers are still listed, in the exited state
```
