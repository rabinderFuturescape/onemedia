<p align="center">
  <a href="https://affiliate.postiz.com">
    <img src="https://github.com/user-attachments/assets/af9f47b3-e20c-402b-bd11-02f39248d738" />
  </a>
</p>

<p align="center">
  <a href="https://postiz.com/" target="_blank">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/765e9d72-3ee7-4a56-9d59-a2c9befe2311">
    <img alt="Postiz Logo" src="https://github.com/user-attachments/assets/f0d30d70-dddb-4142-8876-e9aa6ed1cb99" width="280"/>
  </picture>
  </a>
</p>


<p align="center">
<a href="https://opensource.org/licenses/Apache-2.0">
  <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License">
</a>
</p>

<div align="center">
  <strong>
  <h2>Your ultimate AI social media scheduling tool</h2><br />
  <a href="https://postiz.com">Postiz</a>: An alternative to: Buffer.com, Hypefury, Twitter Hunter, Etc...<br /><br />
  </strong>
  Postiz offers everything you need to manage your social media posts,<br />build an audience, capture leads, and grow your business.
</div>


<div class="flex" align="center">
  <br />
  <img alt="Instagram" src="https://postiz.com/svgs/socials/Instagram.svg" width="32">
  <img alt="Youtube" src="https://postiz.com/svgs/socials/Youtube.svg" width="32">
  <img alt="Dribbble" src="https://postiz.com/svgs/socials/Dribbble.svg" width="32">
  <img alt="Linkedin" src="https://postiz.com/svgs/socials/Linkedin.svg" width="32">
  <img alt="Reddit" src="https://postiz.com/svgs/socials/Reddit.svg" width="32">
  <img alt="TikTok" src="https://postiz.com/svgs/socials/TikTok.svg" width="32">
  <img alt="Facebook" src="https://postiz.com/svgs/socials/Facebook.svg" width="32">
  <img alt="Pinterest" src="https://postiz.com/svgs/socials/Pinterest.svg" width="32">
  <img alt="Threads" src="https://postiz.com/svgs/socials/Threads.svg" width="32">
  <img alt="X" src="https://postiz.com/svgs/socials/X.svg" width="32">
  <img alt="X" src="https://postiz.com/svgs/socials/Slack.svg" width="32">
  <img alt="X" src="https://postiz.com/svgs/socials/Discord.svg" width="32">
  <img alt="X" src="https://postiz.com/svgs/socials/Mastodon.svg" width="32">
  <img alt="X" src="https://postiz.com/svgs/socials/Bluesky.svg" width="32">
</div>

<p align="center">
  <br />
  <a href="https://docs.postiz.com" rel="dofollow"><strong>Explore the docs »</strong></a>
  <br />

  <br/>
    <a href="https://platform.postiz.com">Register</a>
    ·
    <a href="https://discord.postiz.com">Join Our Discord (devs only)</a>
    ·
    <a href="https://twitter.com/getpostiz">X</a>
    ·
    <a href="https://gitroom.com">Gitroom</a>
    ·
    <a href="https://git.sn/telegram">Telegram (Crypto)</a>
  </p>

<br />

<p align="center">
  <video src="https://github.com/user-attachments/assets/05436a01-19c8-4827-b57f-05a5e7637a67" width="100%" />
</p>

## ✨ Features

| ![Image 1](https://github.com/user-attachments/assets/a27ee220-beb7-4c7e-8c1b-2c44301f82ef) | ![Image 2](https://github.com/user-attachments/assets/eb5f5f15-ed90-47fc-811c-03ccba6fa8a2) |
|--------------------------------|--------------------------------|
| ![Image 3](https://github.com/user-attachments/assets/d51786ee-ddd8-4ef8-8138-5192e9cfe7c3) | ![Image 4](https://github.com/user-attachments/assets/91f83c89-22f6-43d6-b7aa-d2d3378289fb) |

# Intro

- Schedule all your social media posts (many AI features)
- Measure your work with analytics.
- Collaborate with other team members to exchange or buy posts.
- Invite your team members to collaborate, comment, and schedule posts.
- At the moment there is no difference between the hosted version to the self-hosted version

## Tech Stack

- NX (Monorepo)
- NextJS (React)
- NestJS
- Prisma (Default to PostgreSQL)
- Redis (BullMQ)
- Resend (email notifications)
- Keycloak/OneSSO (Authentication)
- Prometheus & Grafana (Monitoring)
- Docker & Docker Compose (Containerization)

## Architecture

Postiz follows a microservices architecture with the following components:

- **Frontend**: Next.js application with server-side rendering
- **Backend**: NestJS API server with PostgreSQL database
- **Authentication**: Keycloak/OneSSO integration for secure authentication
- **Caching**: Redis for caching and session management
- **Monitoring**: Prometheus and Grafana for monitoring and alerting

## Quick Start
To have the project up and running, please follow these instructions:

### Prerequisites

- Docker and Docker Compose
- Node.js 20.x
- npm 9.x

### Installation

1. Clone the repository:

```bash
git clone https://github.com/rabinderFuturescape/onemedia.git
cd onemedia
```

2. Install dependencies:

```bash
npm install
```

### Building and Running with Docker

#### Option 1: Using BuildKit (Recommended)

1. **Build all services with BuildKit**

   ```bash
   ./build-with-buildkit.sh
   ```

   This will build all services with BuildKit for better performance.

2. **Run all services**

   ```bash
   docker-compose -f docker/compose/docker-compose.yml up -d
   ```

#### Option 2: Build and Run Infrastructure First

1. **Build and run infrastructure services**

   ```bash
   ./build-infra.sh
   ```

   This will build and start the following services:
   - PostgreSQL
   - Redis
   - Keycloak

2. **Build and run application services**

   ```bash
   ./build-sequential.sh
   ```

   This will build and start the following services:
   - Backend (Nest.js)
   - Frontend (Next.js)
   - OneSSO
   - Auth Service

#### Option 3: Running in Development Mode

1. **Build and run infrastructure services**

   ```bash
   ./build-infra.sh
   ```

2. **Run the application in development mode**

   ```bash
   ./run-app.sh
   ```

   This will start all application services in development mode with hot reloading.

### Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- OneSSO: http://localhost:3003
- Auth Service: http://localhost:3002
- Keycloak: http://localhost:8080

### Admin Credentials

- Username: admin@example.com
- Password: admin

### Development

For local development, you can use the following commands:

```bash
# Run frontend in development mode
npm run start:dev --workspace=frontend

# Run backend in development mode
npm run start:dev --workspace=backend

# Run onesso in development mode
npm run start:dev --workspace=onesso

# Run auth-service in development mode
npm run start:dev --workspace=auth-service
```

## Developer Resources
- [Docker Testing Guide](docs/developer-guide-docker.md): How to run the Postiz Docker image for testing the entire project
- [onesso Authentication Guide](docs/developer-guide-onesso.md): How to run the application with onesso authentication
- [Folder Structure Guide](FOLDER_STRUCTURE.md): Standardized folder structure for the codebase
- [API Documentation](http://localhost:3000/api/docs): Interactive API documentation
- [BuildKit Guide](BUILDKIT.md): How to use BuildKit for faster Docker builds

## Deployment

### Production Deployment

For production deployment, use the production Docker Compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Monitoring

Postiz includes a comprehensive monitoring stack with Prometheus and Grafana:

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

Access the monitoring dashboards:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (default credentials: admin/admin)

## Testing

Postiz includes comprehensive testing:

```bash
# Run unit tests
npm run test

# Run end-to-end tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

## Invest in the Postiz Coin :)
DMsTbeCfX1crgAse5tver98KAMarPWeP3d6U3Gmmpump

# License

This repository's source code is available under the [AGPL-3.0 license](LICENSE).

<br /><br /><br />

<p align="center">
  <a href="https://www.g2.com/products/postiz/take_survey" target="blank"><img alt="g2" src="https://github.com/user-attachments/assets/892cb74c-0b49-4589-b2f5-fbdbf7a98f66" /></a>
</p>


