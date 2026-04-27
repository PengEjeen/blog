---
title: Jenkins TUTORIAL
date: 2026-04-24
---

# 0) 준비
- `backend/requirements.txt`에 **gunicorn** 추가
  ```
  gunicorn==21.*
  ```
- 헬스 체크 라우트가 `/api/health/`로 열려 있어야 함

```python
# 정적/미디어를 Nginx가 직접 서빙할 경로(컨테이너 내부)
STATIC_URL = '/django-static/'
MEDIA_URL = '/media/'
STATIC_ROOT = "/var/www/static"
MEDIA_ROOT = "/var/www/media"
```

# 1) v1 — 백엔드만 컨테이너 (Gunicorn)
```dockerfile
# v1: Backend only (Gunicorn)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
 && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000

CMD ["/usr/local/bin/gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
```

검증
```bash
docker build -f backend/Dockerfile -t myapp:v1 .
docker run --rm -p 8000:8000 myapp:v1
curl -s http://localhost:8000/api/health/
```

# 2) v2 — Nginx + Supervisor
## deploy/nginx.conf
```nginx
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location /static/ {
        root /usr/share/nginx/html;
        access_log off;
        expires 7d;
    }

    location /django-static/ {
        alias /var/www/static/;
        access_log off;
        expires 7d;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host               $host;
        proxy_set_header X-Real-IP          $remote_addr;
        proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto  $http_x_forwarded_proto;
        proxy_read_timeout 300;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## deploy/supervisord.conf
```ini
[supervisord]
nodaemon=true
user=root
logfile=/dev/stdout
logfile_maxbytes=0
pidfile=/tmp/supervisord.pid

[program:gunicorn]
directory=/app
command=/usr/local/bin/gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
autostart=true
autorestart=true
stdout_logfile=/dev/fd/1
stdout_logfile_maxbytes=0
stderr_logfile=/dev/fd/2
stderr_logfile_maxbytes=0
priority=10

[program:nginx]
command=/usr/sbin/nginx -g 'daemon off;'
autostart=true
autorestart=true
stdout_logfile=/dev/fd/1
stdout_logfile_maxbytes=0
stderr_logfile=/dev/fd/2
stderr_logfile_maxbytes=0
priority=20
```

## deploy/entrypoint.sh
```bash
#!/usr/bin/env bash
set -e
mkdir -p /var/www/static /var/www/media
python manage.py collectstatic --noinput || true
exec $(which supervisord) -c /etc/supervisor/supervisord.conf
```

## backend/Dockerfile (v2)
```dockerfile
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev python3-dev default-libmysqlclient-dev pkg-config nginx \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade supervisor
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY deploy/nginx.conf       /etc/nginx/conf.d/default.conf
COPY deploy/supervisord.conf /etc/supervisor/supervisord.conf
COPY deploy/entrypoint.sh    /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
CMD ["/entrypoint.sh"]
```

# 3) v3 — 프런트(React) 통합
```dockerfile
FROM node:20 AS fe-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.10-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev python3-dev default-libmysqlclient-dev pkg-config nginx \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade supervisor
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=fe-build /app/frontend/dist /usr/share/nginx/html
COPY deploy/nginx.conf       /etc/nginx/conf.d/default.conf
COPY deploy/supervisord.conf /etc/supervisor/supervisord.conf
COPY deploy/entrypoint.sh    /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
CMD ["/entrypoint.sh"]
```
