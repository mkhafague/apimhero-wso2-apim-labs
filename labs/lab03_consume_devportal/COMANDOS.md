# Lab 3 — Consumir una API como un socio — comandos

> Chuleta para copiar y pegar. Las explicaciones, los resultados esperados y el incidente están en la ficha del lab.

## Paso 0 — El estado de partida

```bash
docker compose --profile core --profile apps ps
```

```bash
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:9443/devportal/
curl    -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/health
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
```

## Paso 2 — El token OAuth 2 con curl

```bash
curl -k -s -u CONSUMER_KEY:CONSUMER_SECRET -d "grant_type=client_credentials" --data-urlencode "scope=petstore:read petstore:write" https://localhost:9443/oauth2/token
```

## Paso 3 — Llamar a la API a través del gateway

```bash
curl -k -s -i -H "Authorization: Bearer TU_ACCESS_TOKEN" https://localhost:8243/petstore/1.0.0/pets
```

```bash
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
```

## Limpieza

```bash
docker compose --profile core --profile apps stop
```
