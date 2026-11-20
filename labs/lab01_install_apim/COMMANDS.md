# Lab 1 — Install WSO2 API Manager with Docker — commands

> Copy-paste cheat sheet. Explanations, expected results and the incident are in the lab sheet.

## Step 1 — Two checks

```bash
docker --version
```

```bash
docker info --format "{{.MemTotal}}" | awk '{printf "%.1f GB\n", $1/1073741824}'
```

## Step 3 — The sabotage: set the ghost proxy

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
sudo systemctl show --property=Environment docker    # the proxy must show up
```

## Step 4 — The failure

```bash
docker compose --profile core up -d
```

## Step 6 — The resolution

```bash
sudo rm /etc/systemd/system/docker.service.d/proxy-simulation-lab01.conf
sudo systemctl daemon-reload
sudo systemctl restart docker
sudo systemctl show --property=Environment docker    # must no longer list the proxy
```

## Step 7 — Relaunch and startup

```bash
docker compose --profile core up -d
```

```bash
docker compose ps
docker compose logs -f wso2am
```

## Step 9 — curl checks

```bash
curl -k -s -L -o /dev/null -w "%{http_code}\n" https://localhost:9443/publisher
curl -k -s -i https://localhost:8243/
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:8243/petstore/1.0.0/pets
```

## Cleanup (end of working session)

```bash
docker compose --profile core stop      # stop without removal (container kept, no new download)
```
