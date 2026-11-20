# Lab 4 — Tests d'API automatisés (curl & harnais Node) — commandes

> Aide-mémoire à copier-coller. Les explications, les résultats attendus et l'incident sont dans la fiche du lab.

```bash
docker compose --profile core --profile apps start
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
```

## Étape 2 — Le harnais de tests du dépôt

```bash
cd ../apis/tests        # depuis labs/
node run-tests.mjs --env env.petstore-direct.json --suite petstore
```

```bash
node run-tests.mjs --env env.gateway.json --suite petstore --report-json results.json
```

## Étape 3 — Cassez quelque chose (exit code)

```bash
# second terminal, dans labs/
docker compose stop petstore
```

```bash
# terminal de l'étape 2, dans apis/tests/
node run-tests.mjs --env env.gateway.json --suite petstore
```

## Nettoyage

```bash
docker compose --profile core --profile apps stop
```
