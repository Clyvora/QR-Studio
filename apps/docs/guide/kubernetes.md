# Kubernetes

QRCODE can run on Kubernetes as a stateless Deployment backed by PostgreSQL, or as a single-replica Deployment using SQLite on a persistent volume. The manifests below are plain YAML and do not require Helm or an operator. They use the image published to `ghcr.io/Clyvora/QRCODE`; to use your own build, push `docker/Dockerfile` to a registry the cluster can pull from and change the `image` fields.

::: warning Rate limits are per replica
Rate limits are held in memory, so with `N` replicas each limit is effectively multiplied by `N`. Lower the `QRCODE_RATE_LIMIT_*` values or enforce limits at the ingress if this matters for your deployment.
:::

## Option A: PostgreSQL with multiple replicas

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: QRCODE
type: Opaque
stringData:
  QRCODE_DATABASE_URL: postgres://QRCODE:CHANGE_ME@postgres.db.svc:5432/QRCODE?sslmode=disable
  QRCODE_ADMIN_EMAIL: admin@example.com
  QRCODE_ADMIN_PASSWORD: CHANGE_ME_TOO
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: QRCODE
spec:
  replicas: 2
  selector:
    matchLabels: { app: QRCODE }
  template:
    metadata:
      labels: { app: QRCODE }
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
      containers:
        - name: QRCODE
          image: ghcr.io/Clyvora/QRCODE:0.1.0
          ports:
            - containerPort: 8080
          envFrom:
            - secretRef: { name: QRCODE }
          env:
            - name: QRCODE_BASE_URL
              value: https://qr.example.com
            - name: QRCODE_TRUSTED_PROXIES
              value: 10.0.0.0/8          # your pod / ingress CIDR
            - name: QRCODE_LOG_FORMAT
              value: json
          readinessProbe:
            httpGet: { path: /api/v1/health, port: 8080 }
            periodSeconds: 10
          livenessProbe:
            httpGet: { path: /api/v1/health, port: 8080 }
            periodSeconds: 30
          resources:
            requests: { cpu: 50m, memory: 64Mi }
            limits: { memory: 256Mi }
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities: { drop: [ALL] }
---
apiVersion: v1
kind: Service
metadata:
  name: QRCODE
spec:
  selector: { app: QRCODE }
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: QRCODE
spec:
  ingressClassName: nginx
  tls:
    - hosts: [qr.example.com]
      secretName: QRCODE-tls   # e.g. issued by cert-manager + Let's Encrypt
  rules:
    - host: qr.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service: { name: QRCODE, port: { number: 80 } }
```

Migrations run at startup. To avoid several replicas migrating at the same time, run a one-off `Job` with `args: ["-migrate"]` before the first rollout and before upgrades.

Any PostgreSQL 13+ server works, whether managed or run in the cluster with an operator such as CloudNativePG.

## Option B: SQLite with a single replica

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: QRCODE-data
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests: { storage: 1Gi }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: QRCODE
spec:
  replicas: 1
  strategy:
    type: Recreate            # never run two writers on one SQLite file
  selector:
    matchLabels: { app: QRCODE }
  template:
    metadata:
      labels: { app: QRCODE }
    spec:
      securityContext:
        runAsUser: 10001
        fsGroup: 10001
      containers:
        - name: QRCODE
          image: ghcr.io/Clyvora/QRCODE:0.1.0
          ports:
            - containerPort: 8080
          env:
            - name: QRCODE_BASE_URL
              value: https://qr.example.com
            - name: QRCODE_DATABASE_URL
              value: sqlite:///data/QRCODE.db
          volumeMounts:
            - name: data
              mountPath: /data
          readinessProbe:
            httpGet: { path: /api/v1/health, port: 8080 }
      volumes:
        - name: data
          persistentVolumeClaim: { claimName: QRCODE-data }
```

Use the Service and Ingress from option A.

## Custom domains on Kubernetes

Each custom hostname needs a TLS certificate at the ingress. Either add the hostnames to the Ingress and let cert-manager issue certificates, or place Caddy in front with on-demand TLS as described in [Custom domains](./custom-domains#caddy-on-demand-tls), pointing its `ask` URL at `http://QRCODE.<namespace>.svc/api/v1/domains/check`.
