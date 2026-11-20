# Lab 3 — Consommer une API comme un partenaire — commandes

> Aide-mémoire à copier-coller. Les explications, les résultats attendus et l'incident sont dans la fiche du lab.

## Étape 0 — L'état de départ

```bash
docker compose --profile core --profile apps ps
```

```bash
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:9443/devportal/
curl    -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/health
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
```

## Étape 2 — Le jeton OAuth 2 en curl

```bash
curl -k -s -u CONSUMER_KEY:CONSUMER_SECRET -d "grant_type=client_credentials" --data-urlencode "scope=petstore:read petstore:write" https://localhost:9443/oauth2/token
```

## Étape 3 — Appeler l'API via la gateway

```bash
curl -k -s -i -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" https://localhost:8243/petstore/1.0.0/pets
```

```bash
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
```

## Nettoyage

```bash
docker compose --profile core --profile apps stop
```
