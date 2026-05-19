# Deployment Guide for Distributed Architecture

## Deployment Strategy

The distributed system spans 3 geographic locations with synchronized deployments:

```
┌─────────────────────────────────────────────────────────────────┐
│ Development Environment (Local)                                 │
└────────────────────────────┬────────────────────────────────────┘
                             ↓ (git push)
┌─────────────────────────────────────────────────────────────────┐
│ CI/CD Pipeline (GitHub Actions / Jenkins)                       │
│ - Run tests and linting                                         │
│ - Build Docker image                                            │
│ - Run security scans                                            │
└────────────────────────────┬────────────────────────────────────┘
                             ↓ (push to registry)
┌─────────────────────────────────────────────────────────────────┐
│ Docker Registry (Docker Hub / Private Registry)                  │
│ - Store built images with version tags                          │
└────────────────────────────┬────────────────────────────────────┘
                             ↓ (orchestrate)
     ┌───────────────────────┼───────────────────────┐
     ↓                       ↓                       ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Staging Test   │  │  Load Balancer  │  │   Production    │
│  (Karachi)      │  │    (Nginx)      │  │  (All 3 sites)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                             ↓
           ┌───────────────────┼───────────────────┐
           ↓                   ↓                   ↓
      ┌──────────┐        ┌──────────┐        ┌──────────┐
      │Islamabad │        │ Karachi  │        │Peshawar  │
      │ (Master) │        │ (Slave)  │        │ (Slave)  │
      └──────────┘        └──────────┘        └──────────┘
```

## Environment Setup

### Server Requirements

**All Servers (Islamabad, Karachi, Peshawar):**

```
CPU: 4 cores minimum
RAM: 8GB minimum
Storage: 100GB SSD
OS: Ubuntu 22.04 LTS
Network: 1Gbps interconnect between locations

Services per server:
- Next.js application (Node.js)
- Redis client
- MySQL client
- PostgreSQL client (Islamabad only)
- Nginx (load balancer on dedicated instance OR on primary)
```

**Dedicated Load Balancer Server:**

```
CPU: 2 cores
RAM: 4GB
Storage: 20GB
Network: 1Gbps
Role: Nginx reverse proxy distribution traffic across 3 campus servers
```

### Firewall Rules

**Between Campuses (all allow):**
```
3000:3000  - Next.js application traffic
3306:3306  - MySQL replication
5432:5432  - PostgreSQL replication
6379:6379  - Redis cluster
8080:8080  - Nginx status monitoring
22:22      - SSH for management
```

**From Internet (load balancer only):**
```
80:80      - HTTP redirect
443:443    - HTTPS application traffic
```

## Deployment Steps

### Phase 1: Prepare Infrastructure

#### 1.1 Provision Servers

```bash
# Create 3 Ubuntu servers (via cloud provider or on-premise)
# Islamabad: 192.168.1.10 (Next.js) + 192.168.1.100 (MySQL) + 192.168.1.200 (PostgreSQL)
# Karachi: 192.168.2.10 (Next.js) + 192.168.2.100 (MySQL Slave) + 192.168.2.200 (PostgreSQL Replica)
# Peshawar: 192.168.3.10 (Next.js) + 192.168.3.100 (MySQL Slave) + 192.168.3.200 (PostgreSQL Replica)

# Provision load balancer: 192.168.0.50 (Nginx)
```

#### 1.2 Basic Server Configuration

```bash
#!/bin/bash
# shared across all app servers

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs npm

# Install PM2 for process management
sudo npm install -g pm2

# Install Docker (optional, for containerization)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Verify installations
node --version
npm --version
docker --version

# Set up non-root user for application
sudo useradd -m -d /home/appuser appuser
sudo usermod -aG docker appuser
```

#### 1.3 SSH Key Setup for Inter-Server Communication

```bash
#!/bin/bash
# On all app servers, set up SSH for password-less connections

# Generate SSH key
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519

# Share public key between servers
# On Islamabad
cat ~/.ssh/id_ed25519.pub | ssh appuser@192.168.2.10 'cat >> ~/.ssh/authorized_keys'
cat ~/.ssh/id_ed25519.pub | ssh appuser@192.168.3.10 'cat >> ~/.ssh/authorized_keys'

# Verify connectivity
ssh appuser@192.168.2.10 "echo 'Karachi SSH OK'"
ssh appuser@192.168.3.10 "echo 'Peshawar SSH OK'"
```

### Phase 2: Deploy Databases

Follow the detailed setup guides:
- [MySQL Master-Slave Replication](./mysql-replication.md)
- [Redis Cluster Setup](./redis-cluster-setup.md)
- [PostgreSQL Replication](./postgresql-replication.md)

Quick verification after setup:

```bash
#!/bin/bash
# distributed/verify-databases.sh

echo "=== Verifying MySQL ==="
mysql -h 192.168.1.100 -u root -p -e "SHOW MASTER STATUS\G" | head -5
mysql -h 192.168.2.100 -u root -p -e "SHOW SLAVE STATUS\G" | grep -E "Slave_IO_Running|Slave_SQL_Running"

echo -e "\n=== Verifying Redis ==="
redis-cli -h 192.168.1.50 cluster info | grep cluster_state

echo -e "\n=== Verifying PostgreSQL ==="
psql -h 192.168.1.200 -U postgres -c "SELECT version();"
psql -h 192.168.2.200 -U postgres -c "SELECT pg_last_wal_receive_lsn();"
```

### Phase 3: Deploy Nginx Load Balancer

```bash
#!/bin/bash
# On load balancer server: 192.168.0.50

# Install Nginx
sudo apt-get install -y nginx

# Copy configuration
sudo cp nginx-load-balancer.conf /etc/nginx/sites-available/dam-lab
sudo ln -s /etc/nginx/sites-available/dam-lab /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Verify
curl http://localhost/health
# Should return: load-balancer-ok
```

### Phase 4: Deploy Application

#### 4.1 Clone Repository on All App Servers

```bash
#!/bin/bash
# Run on each app server

cd /home/appuser
git clone https://github.com/yourusername/dam-lab-project.git
cd dam-lab-project

# Install dependencies
npm install

# Install TypeScript and build tools globally
sudo npm install -g typescript ts-node
```

#### 4.2 Create Environment File

Create `.env` on each server based on location:

**Islamabad (.env):**
```env
# Server Configuration
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://dam-lab.university.edu/api

# MySQL (Master)
MYSQL_MASTER_HOST=192.168.1.100
MYSQL_MASTER_PORT=3306
MYSQL_MASTER_USER=root
MYSQL_MASTER_PASSWORD=your-secure-password
MYSQL_MASTER_DATABASE=university_main

# MySQL (Slaves for reads)
MYSQL_SLAVE_HOST_1=192.168.2.100
MYSQL_SLAVE_PORT_1=3306
MYSQL_SLAVE_HOST_2=192.168.3.100
MYSQL_SLAVE_PORT_2=3306
MYSQL_SLAVE_USER=root
MYSQL_SLAVE_PASSWORD=your-secure-password
MYSQL_SLAVE_DATABASE=university_main

# PostgreSQL (Master)
PG_MASTER_HOST=192.168.1.200
PG_MASTER_PORT=5432
PG_MASTER_USER=postgres
PG_MASTER_PASSWORD=your-secure-password
PG_MASTER_DATABASE=university_analytics

# PostgreSQL (Replicas for reads)
PG_SLAVE_HOST_1=192.168.2.200
PG_SLAVE_PORT_1=5432
PG_SLAVE_HOST_2=192.168.3.200
PG_SLAVE_PORT_2=5432
PG_SLAVE_USER=postgres
PG_SLAVE_PASSWORD=your-secure-password
PG_SLAVE_DATABASE=university_analytics

# Redis Cluster
REDIS_CLUSTER_NODES=192.168.1.50:6379,192.168.2.50:6379,192.168.3.50:6379

# JWT Configuration
JWT_SECRET=your-very-long-random-secret-key-min-32-characters

# Email Configuration
SMTP_HOST=mail.university.edu
SMTP_PORT=587
SMTP_USER=noreply@university.edu
SMTP_PASSWORD=email-password

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**Karachi & Peshawar (.env):** (Same as Islamabad - databases are synchronized)

#### 4.3 Build Application

```bash
#!/bin/bash
# On each app server

cd /home/appuser/dam-lab-project

# Build Next.js
npm run build

# Verify build
ls .next/
```

#### 4.4 Start Application with PM2

```bash
#!/bin/bash
# On each app server

# Start application
pm2 start npm --name "dam-lab" -- run start

# Make it auto-start on reboot
pm2 startup
pm2 save

# Verify running
pm2 list
pm2 logs dam-lab
```

### Phase 5: Verify Deployment

```bash
#!/bin/bash
# distributed/verify-deployment.sh

echo "=== Health Checks ==="

# Check load balancer
echo "Load Balancer:"
curl -s http://192.168.0.50/health

# Check each app server
echo "Islamabad App:"
curl -s http://192.168.1.10:3000/health

echo "Karachi App:"
curl -s http://192.168.2.10:3000/health

echo "Peshawar App:"
curl -s http://192.168.3.10:3000/health

# Test database connectivity through app
echo -e "\n=== Testing Database Connectivity ==="
curl -s http://192.168.1.10:3000/api/health | jq .

# Test authentication
echo -e "\n=== Testing Authentication ==="
curl -X POST http://192.168.0.50/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

## Continuous Deployment

### Git Workflow

```
main branch (stable)
  ↓
  GitHub Actions CI/CD
    ↓
  Run tests, lint, security scan
    ↓
  Build Docker image
    ↓
  Push to registry
    ↓
  Deploy to staging (Karachi)
    ↓
  Run integration tests
    ↓
  Deploy to production (all 3 sites)
```

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Distributed System

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build -t dam-lab:${{ github.sha }} .
          docker tag dam-lab:${{ github.sha }} dam-lab:latest
      
      - name: Push to registry
        run: |
          docker login -u ${{ secrets.DOCKER_USER }} -p ${{ secrets.DOCKER_PASS }}
          docker push dam-lab:${{ github.sha }}
          docker push dam-lab:latest
      
      - name: Deploy to staging (Karachi)
        run: |
          ssh appuser@192.168.2.10 << 'EOF'
            cd ~/dam-lab-project
            git pull origin main
            npm install
            npm run build
            pm2 restart dam-lab
          EOF
      
      - name: Run integration tests on staging
        run: npm run test:integration -- --env staging
      
      - name: Deploy to production
        if: success()
        run: |
          for host in 192.168.1.10 192.168.2.10 192.168.3.10; do
            ssh appuser@$host << EOF
              cd ~/dam-lab-project
              git pull origin main
              npm install
              npm run build
              pm2 restart dam-lab
            EOF
          done
```

## Scaling Considerations

### Add More Replicas

To add a 4th campus location:

```bash
# 1. Provision server at 192.168.4.X
# 2. Configure MySQL slave replication
# 3. Configure PostgreSQL replica
# 4. Configure Redis cluster node
# 5. Deploy app and register with load balancer
```

### Upgrade All Servers Simultaneously

```bash
#!/bin/bash
# distributed/rolling-upgrade.sh

servers=("192.168.1.10" "192.168.2.10" "192.168.3.10")

for server in "${servers[@]}"; do
  echo "Upgrading $server..."
  
  ssh appuser@$server << 'EOF'
    cd ~/dam-lab-project
    git fetch origin
    git checkout main
    git pull
    npm install
    npm run build
    
    # Graceful restart (waits for current requests to finish)
    pm2 restart dam-lab --update-env --wait-ready
  EOF
  
  # Wait for server to stabilize
  sleep 30
  
  # Health check
  if curl -s http://$server:3000/health | grep -q "ok"; then
    echo "✓ $server is healthy"
  else
    echo "✗ $server health check failed!"
    exit 1
  fi
done

echo "Rolling upgrade complete!"
```

## Backup and Restore

### Automated Backup Schedule

```bash
#!/bin/bash
# /etc/cron.d/dam-lab-backup
# Runs daily at 2 AM

0 2 * * * appuser /home/appuser/dam-lab-project/distributed/backup.sh

# backup.sh contents:
#!/bin/bash
BACKUP_DIR="/backups/dam-lab/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# MySQL backup
mysqldump -u root -p --all-databases > $BACKUP_DIR/mysql-backup.sql

# PostgreSQL backup
pg_dump -U postgres -d university_analytics > $BACKUP_DIR/postgres-backup.sql

# Application source
tar -czf $BACKUP_DIR/app-backup.tar.gz ~/dam-lab-project/

# Cleanup old backups (keep last 30 days)
find /backups/dam-lab -type d -mtime +30 -exec rm -rf {} \;
```

### Restore from Backup

```bash
#!/bin/bash
# distributed/restore.sh

BACKUP_DATE=$1  # e.g., 2024-01-15

if [ -z "$BACKUP_DATE" ]; then
  echo "Usage: ./restore.sh YYYY-MM-DD"
  exit 1
fi

BACKUP_DIR="/backups/dam-lab/$BACKUP_DATE"

echo "Restoring from $BACKUP_DATE..."

# Stop application
pm2 stop dam-lab

# Restore MySQL
mysql -u root -p < $BACKUP_DIR/mysql-backup.sql

# Restore PostgreSQL
psql -U postgres -d university_analytics < $BACKUP_DIR/postgres-backup.sql

# Restore application
tar -xzf $BACKUP_DIR/app-backup.tar.gz

# Start application
pm2 start dam-lab

echo "Restore complete!"
```

## Monitoring and Alerting

Use Prometheus + Grafana for monitoring:

```bash
# Install Prometheus
sudo apt-get install -y prometheus

# Create prometheus.yml config
sudo tee /etc/prometheus/prometheus.yml > /dev/null << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'next-app'
    static_configs:
      - targets: ['192.168.1.10:3000', '192.168.2.10:3000', '192.168.3.10:3000']
  
  - job_name: 'nginx'
    static_configs:
      - targets: ['192.168.0.50:8080']
  
  - job_name: 'mysql'
    static_configs:
      - targets: ['192.168.1.100:3306']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['192.168.1.200:5432']
EOF

# Start Prometheus
sudo systemctl restart prometheus
```

## Key Deployment Principles

1. **Infrastructure as Code:** Use Terraform/Ansible for reproducible infrastructure
2. **Automated Testing:** Run tests before deploying
3. **Staged Rollout:** Deploy to staging first, then production
4. **Health Checks:** Verify each server is healthy before proceeding
5. **Rollback Plan:** Keep previous version available for quick rollback
6. **Monitoring:** Track metrics and logs from all servers
7. **Documentation:** Keep deployment playbooks updated
8. **Security:** Use secrets management (HashiCorp Vault, AWS Secrets Manager)

## Troubleshooting Deployments

### If deployment fails on one server

```bash
# 1. Check logs
pm2 logs dam-lab

# 2. Revert to previous version
git checkout HEAD~1
npm run build
pm2 restart dam-lab

# 3. Investigate issue
npm run test:integration

# 4. Once fixed, deploy again
git pull origin main
npm run build
pm2 restart dam-lab
```

### If database migration fails

```bash
# 1. Check MySQL/PostgreSQL logs
sudo tail -f /var/log/mysql/error.log
sudo tail -f /var/log/postgresql/postgresql.log

# 2. Restore from backup
./distributed/restore.sh YYYY-MM-DD

# 3. Fix migration script and retry
```

## Compliance & Security

- Encrypt connections: Use TLS 1.3 for all network traffic
- Secrets management: Never commit passwords to git
- Access control: Use SSH keys, not passwords
- Audit logging: Log all deployments and access
- Compliance: Ensure data residency in Pakistan (all servers on-premise)
