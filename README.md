
# Employee Leave Management System

A premium, role-based Employee Leave Management System (ELMS) designed with a glassmorphic "Obsidian Nebula" dark theme. It features three portals: **Employee**, **Manager**, and **HR Admin**.

The project is structured for serverless AWS hosting and is prepared for CI/CD.

## Architecture

- **Frontend**: React (Vite + TypeScript) styled with pure Vanilla CSS for rich visual aesthetics. Hostable on AWS S3 & CloudFront.
- **Backend**: AWS Lambda-compatible API handlers written in Node.js.
- **Infrastructure**: AWS Cloud Development Kit (CDK) in TypeScript defining S3, CloudFront, Cognito (auth with custom role groups), API Gateway, Lambda, and DynamoDB.
- **CI/CD**: GitHub Actions workflows for automated tests, building, and zero-downtime AWS deployments.

```
├── .github/workflows/    # CI/CD Workflows
├── backend/              # Serverless AWS Lambda API Handlers
├── frontend/             # React SPA (Vite + TypeScript + Vanilla CSS)
├── infrastructure/       # AWS CDK IaC Project (TypeScript)
├── package.json          # Root Monorepo configuration
└── README.md             # This file
```

## Local Development Setup

### 1. Installation
Install all root workspace and project dependencies:
```bash
npm install
```

### 2. Run Frontend locally
Launch the frontend React application with local mock storage state simulating Cognito auth and DynamoDB responses:
```bash
npm run frontend:dev
```

### 3. Deploying to AWS via CDK
Prerequisites: AWS CLI installed and configured.
```bash
# Bootstrap CDK once (if not done already)
npm run infra:cdk -- bootstrap

# Synthesize CloudFormation template
npm run infra:cdk -- synth

# Deploy stack to AWS
npm run infra:cdk -- deploy
```

## CI/CD Pipeline

The `.github/workflows/deploy.yml` pipeline runs on every push to the `main` branch:
1. Installs dependencies and runs linter checks.
2. Compiles the TypeScript code for the backend Lambdas and infrastructure.
3. Deploys updated AWS resources via `cdk deploy`.
4. Builds the frontend React app and uploads static files to S3, followed by a CloudFront invalidation for instant updates.
