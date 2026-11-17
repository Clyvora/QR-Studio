# syntax=docker/dockerfile:1
#
# Clyvora QR Studio all-in-one image: Go API + redirect service + the built web app.
# Build from the repository root:  docker build -f docker/Dockerfile -t qrcode .

# --- Web app -----------------------------------------------------------------
FROM node:24-alpine AS web
WORKDIR /src
# Workspace manifests first so dependency installation is cached.
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY packages/react/package.json packages/react/
COPY packages/cli/package.json packages/cli/
COPY packages/sdk/package.json packages/sdk/
COPY apps/web/package.json apps/web/
COPY apps/docs/package.json apps/docs/
RUN npm ci --workspace @qrcode/web --no-audit --no-fund
COPY packages/core packages/core
COPY packages/react packages/react
COPY apps/web apps/web
RUN npm run build --workspace @qrcode/web

# --- API server ----------------------------------------------------------------
FROM golang:1.27-alpine AS api
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY server server
COPY apps/api apps/api
ARG VERSION=dev
# modernc.org/sqlite is pure Go, so the binary is fully static.
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/qrcode ./apps/api

# --- Runtime -------------------------------------------------------------------
FROM alpine:3.24
RUN apk add --no-cache ca-certificates tzdata \
 && adduser -D -H -u 10001 qrcode \
 && mkdir -p /data \
 && chown qrcode:qrcode /data
COPY --from=api /out/qrcode /usr/local/bin/qrcode
COPY --from=web /src/apps/web/dist /app/web

ENV QRCODE_ADDR=:8080 \
    QRCODE_WEB_DIR=/app/web \
    QRCODE_DATABASE_URL=sqlite:///data/qrcode.db \
    QRCODE_FILE_DIR=/data/files

USER qrcode
EXPOSE 8080
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/v1/health >/dev/null || exit 1
ENTRYPOINT ["qrcode"]
