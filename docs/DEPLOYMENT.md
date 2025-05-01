# Postiz Deployment Guide

This guide provides instructions for deploying the Postiz application in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring Setup](#monitoring-setup)
- [Backup and Recovery](#backup-and-recovery)
- [Scaling Considerations](#scaling-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying Postiz, ensure you have the following:

- Docker and Docker Compose (for Docker deployment)
- Kubernetes cluster (for Kubernetes deployment)
- PostgreSQL database
- Redis instance
- Keycloak/OneSSO instance
- Domain name and SSL certificates
- Access to container registry (e.g., Docker Hub, GitHub Container Registry)

## Environment Configuration

Postiz uses environment variables for configuration. Create a `.env` file with the following variables:

```
# General Configuration
NODE_ENV=production
PORT=4200

# Frontend Configuration
NEXT_PUBLIC_BACKEND_URL=https://api.example.com
FRONTEND_URL=https://app.example.com
NEXT_PUBLIC_ONESSO_URL=https://auth.example.com

# Backend Configuration
BACKEND_URL=https://api.example.com
BACKEND_INTERNAL_URL=http://postiz-backend:3000/api

# Database Configuration
DATABASE_URL=postgresql://user:password@postgres:5432/postiz-db

# Redis Configuration
REDIS_URL=redis://redis:6379

# OneSSO Configuration
ONESSO_URL=https://auth.example.com
ONESSO_CLIENT_ID=postiz-client
ONESSO_CLIENT_SECRET=your-client-secret
ONESSO_REDIRECT_URI=https://app.example.com/auth/callback

# NextAuth Configuration
NEXTAUTH_URL=https://app.example.com
NEXTAUTH_SECRET=your-nextauth-secret

# JWT Configuration
JWT_SECRET=your-jwt-secret
```

Replace the placeholder values with your actual configuration.

## Docker Deployment

### Production Deployment

For production deployment, use the production Docker Compose file:

```bash
# Clone the repository
git clone https://github.com/rabinderFuturescape/onemedia.git
cd onemedia

# Create .env file with production configuration
cp .env.example .env
# Edit .env with your production values

# Start the production environment
docker-compose -f docker-compose.prod.yml up -d
```

### Staging Deployment

For staging deployment, use the same Docker Compose file with staging-specific environment variables:

```bash
# Create .env.staging file with staging configuration
cp .env.example .env.staging
# Edit .env.staging with your staging values

# Start the staging environment
docker-compose -f docker-compose.prod.yml --env-file .env.staging up -d
```

### Monitoring Deployment

To deploy the monitoring stack:

```bash
# Start the monitoring environment
docker-compose -f docker-compose.monitoring.yml up -d
```

## Kubernetes Deployment

For Kubernetes deployment, use the provided Kubernetes manifests:

```bash
# Apply the Kubernetes manifests
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/secrets.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/postgres.yaml
kubectl apply -f kubernetes/redis.yaml
kubectl apply -f kubernetes/backend.yaml
kubectl apply -f kubernetes/frontend.yaml
kubectl apply -f kubernetes/ingress.yaml
```

### Helm Chart

Alternatively, you can use the Helm chart for deployment:

```bash
# Add the Postiz Helm repository
helm repo add postiz https://charts.postiz.app

# Install the Postiz Helm chart
helm install postiz postiz/postiz \
  --namespace postiz \
  --create-namespace \
  --values values.yaml
```

## CI/CD Pipeline

Postiz includes a GitHub Actions workflow for CI/CD. The workflow:

1. Runs linting and tests on pull requests
2. Builds Docker images for the frontend and backend
3. Runs end-to-end tests in a containerized environment
4. Deploys to staging when changes are pushed to the develop branch
5. Runs performance tests on the staging environment
6. Deploys to production when changes are pushed to the main branch

To set up the CI/CD pipeline:

1. Configure the following GitHub secrets:
   - `DOCKER_USERNAME`: Docker Hub username
   - `DOCKER_PASSWORD`: Docker Hub password
   - `SSH_PRIVATE_KEY`: SSH private key for deployment
   - `SSH_HOST`: SSH host for deployment
   - `SSH_USER`: SSH user for deployment
   - `STAGING_ENV`: Base64-encoded staging environment variables
   - `PRODUCTION_ENV`: Base64-encoded production environment variables

2. Push to the develop branch to trigger a staging deployment
3. Create a pull request to the main branch for production deployment

## Monitoring Setup

Postiz includes a comprehensive monitoring stack with Prometheus and Grafana:

```bash
# Start the monitoring environment
docker-compose -f docker-compose.monitoring.yml up -d
```

Access the monitoring dashboards:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (default credentials: admin/admin)

### Alert Configuration

Configure alerts in Prometheus by editing the `monitoring/prometheus/rules/alerts.yml` file:

```yaml
groups:
  - name: postiz-alerts
    rules:
      - alert: HighCPULoad
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU load on {{ $labels.instance }}"
          description: "CPU load is above 80% for more than 5 minutes on {{ $labels.instance }}."
```

Configure alert notifications in AlertManager by editing the `monitoring/alertmanager/alertmanager.yml` file:

```yaml
receivers:
  - name: 'team-email'
    email_configs:
      - to: 'alerts@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alertmanager@example.com'
        auth_password: 'password'
```

## Backup and Recovery

### Database Backup

Set up regular database backups:

```bash
# Create a backup script
cat > backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR=/var/backups/postgres
mkdir -p $BACKUP_DIR
docker exec postiz-postgres pg_dump -U postiz-user -d postiz-db-local | gzip > $BACKUP_DIR/postiz-db-$TIMESTAMP.sql.gz
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

# Make the script executable
chmod +x backup.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/backup.sh") | crontab -
```

### Database Recovery

To restore from a backup:

```bash
# Restore from backup
gunzip -c /var/backups/postgres/postiz-db-20230101000000.sql.gz | docker exec -i postiz-postgres psql -U postiz-user -d postiz-db-local
```

## Scaling Considerations

### Horizontal Scaling

For horizontal scaling:

1. **Frontend**: Deploy multiple instances behind a load balancer
2. **Backend**: Deploy multiple instances with sticky sessions
3. **Database**: Set up PostgreSQL replication with read replicas
4. **Redis**: Set up Redis Sentinel or Redis Cluster

### Vertical Scaling

For vertical scaling:

1. **Frontend**: Increase CPU and memory resources
2. **Backend**: Increase CPU and memory resources
3. **Database**: Increase CPU, memory, and disk resources
4. **Redis**: Increase CPU and memory resources

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Check the `DATABASE_URL` environment variable
   - Verify PostgreSQL is running and accessible
   - Check network connectivity between containers

2. **Authentication Issues**:
   - Verify OneSSO/Keycloak is running and accessible
   - Check client ID and secret configuration
   - Verify redirect URI configuration

3. **Container Startup Issues**:
   - Check container logs: `docker-compose logs -f`
   - Verify environment variables are set correctly
   - Check for port conflicts

### Logs

Access container logs:

```bash
# View logs for all containers
docker-compose logs -f

# View logs for a specific container
docker-compose logs -f postiz-frontend
docker-compose logs -f postiz-backend
```

### Health Checks

Check container health:

```bash
# Check container health
docker ps

# Check health endpoint
curl http://localhost:4200/api/health
curl http://localhost:3000/api/health
```
