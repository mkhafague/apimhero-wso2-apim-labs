# Lab 4 — Automated API tests (curl & Node harness) — commands

> Copy-paste cheat sheet. Explanations, expected results and the incident are in the lab sheet.

```bash
docker compose --profile core --profile apps start
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
```

## Step 2 — The repository test harness

```bash
cd ../apis/tests        # from labs/
node run-tests.mjs --env env.petstore-direct.json --suite petstore
```

```bash
node run-tests.mjs --env env.gateway.json --suite petstore --report-json results.json
```

## Step 3 — Break something (exit code)

```bash
# second terminal, in labs/
docker compose stop petstore
```

```bash
# step 2 terminal, in apis/tests/
node run-tests.mjs --env env.gateway.json --suite petstore
```

## Cleanup

```bash
docker compose --profile core --profile apps stop
```
