# Lab 2 — Publica tu primera API (Petstore) — comandos

> Chuleta para copiar y pegar. Las explicaciones, los resultados esperados y el incidente están en la ficha del lab.

## Paso 1 — Primero el backend

```bash
docker compose --profile core --profile apps up -d
docker compose ps
```

```bash
curl -s -i http://localhost:8081/health
curl -s -i http://localhost:8081/pets
# ¿la respuesta no cabe en la pantalla? léela página a página (q para salir):
curl -s -i http://localhost:8081/pets | less
```

```bash
curl -s http://localhost:8081/pets/6
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/pets/99
curl -s -X POST http://localhost:8081/pets -H "Content-Type: application/json" -d @payloads/new-pet.json
curl -s -X POST http://localhost:8081/pets -H "Content-Type: application/json" -d @payloads/bad-pet.json
```

## Paso 4 — El incidente (¡no te lo saltes!)

### 4.2 — Provoca la avería

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

## Paso 5 — Comprobar la seguridad por defecto *(opcional, prepara el lab 3)*

```bash
curl -k -s -i https://localhost:8243/petstore/1.0.0/pets
```

## Avería simulada (para ir más lejos)

```bash
curl -s -X POST http://localhost:8081/admin/failure -H "Content-Type: application/json" -d @payloads/failure-on.json
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/pets
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/health
curl -s -X POST http://localhost:8081/admin/failure -H "Content-Type: application/json" -d @payloads/failure-off.json
```

## Limpieza

```bash
docker compose --profile core --profile apps stop
docker compose ps -a      # los contenedores siguen listados, en estado exited
```
