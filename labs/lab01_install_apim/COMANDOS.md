# Lab 1 — Instalar WSO2 API Manager con Docker — comandos

> Chuleta para copiar y pegar. Las explicaciones, los resultados esperados y el incidente están en la ficha del lab.

## Paso 1 — Dos comprobaciones

```bash
docker --version
```

```bash
docker info --format "{{.MemTotal}}" | awk '{printf "%.1f GB\n", $1/1073741824}'
```

## Paso 3 — El sabotaje: poner el proxy fantasma

```bash
docker images wso2/wso2am
```

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/proxy-simulation-lab01.conf <<'EOF'
[Service]
Environment="HTTP_PROXY=http://203.0.113.1:3128"
Environment="HTTPS_PROXY=http://203.0.113.1:3128"
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
sudo systemctl show --property=Environment docker    # el proxy debe aparecer
```

## Paso 4 — La avería

```bash
docker compose --profile core up -d
```

## Paso 6 — La resolución

```bash
sudo rm /etc/systemd/system/docker.service.d/proxy-simulation-lab01.conf
sudo systemctl daemon-reload
sudo systemctl restart docker
sudo systemctl show --property=Environment docker    # ya no debe listar el proxy
```

## Paso 7 — El relanzamiento y el arranque

```bash
docker compose --profile core up -d
```

```bash
docker compose ps
docker compose logs -f wso2am
```

## Paso 9 — Comprobaciones curl

```bash
curl -k -s -L -o /dev/null -w "%{http_code}\n" https://localhost:9443/publisher
curl -k -s -i https://localhost:8243/
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
```

## Limpieza (fin de la sesión de trabajo)

```bash
docker compose --profile core stop      # parada sin supresión (contenedor conservado, sin nueva descarga)
```
