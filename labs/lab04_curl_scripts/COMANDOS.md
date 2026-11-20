# Lab 4 — Pruebas de API automatizadas (curl y suite Node) — comandos

> Chuleta para copiar y pegar. Las explicaciones, los resultados esperados y el incidente están en la ficha del lab.

```bash
docker compose --profile core --profile apps start
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
```

## Paso 2 — La suite de pruebas del repositorio

```bash
cd ../apis/tests        # desde labs/
node run-tests.mjs --env env.petstore-direct.json --suite petstore
```

```bash
node run-tests.mjs --env env.gateway.json --suite petstore --report-json results.json
```

## Paso 3 — Rompe algo (código de salida)

```bash
# segundo terminal, en labs/
docker compose stop petstore
```

```bash
# terminal del paso 2, en apis/tests/
node run-tests.mjs --env env.gateway.json --suite petstore
```

## Limpieza

```bash
docker compose --profile core --profile apps stop
```
