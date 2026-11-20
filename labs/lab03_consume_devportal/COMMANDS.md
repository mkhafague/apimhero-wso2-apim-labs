# Lab 3 — Consume an API as a partner — commands

> Copy-paste cheat sheet. Explanations, expected results and the incident are in the lab sheet.

## Step 0 — The starting state

```bash
docker compose --profile core --profile apps ps
```

```bash
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:9443/devportal/
curl    -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/health
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
```

## Step 2 — The OAuth 2 token with curl

```bash
curl -k -s -u CONSUMER_KEY:CONSUMER_SECRET -d "grant_type=client_credentials" --data-urlencode "scope=petstore:read petstore:write" https://localhost:9443/oauth2/token
```

## Step 3 — Call the API through the gateway

```bash
curl -k -s -i -H "Authorization: Bearer YOUR_ACCESS_TOKEN" https://localhost:8243/petstore/1.0.0/pets
```

```bash
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
```

## Cleanup

```bash
docker compose --profile core --profile apps stop
```
