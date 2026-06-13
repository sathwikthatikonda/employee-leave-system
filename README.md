# Employee Leave Management System

## Overview

The Employee Leave Management System is a serverless web application built on AWS that allows employees to submit leave requests through a React-based frontend. Leave requests are processed by AWS Lambda functions, stored in DynamoDB, and integrated with SNS notifications.

The project is structured for serverless AWS hosting and is prepared for CI/CD.

## Architecture

```text
User
 │
 ▼
CloudFront
 │
 ▼
S3 (React Frontend)
 │
 ▼
API Gateway
 │
 ▼
AWS Lambda
 │
 ▼
DynamoDB
 │
 ▼
SNS Notifications
```

---

## Features

* Submit employee leave requests
* Serverless backend using AWS Lambda
* REST API using Amazon API Gateway
* Leave request storage in DynamoDB
* Notification integration with Amazon SNS
* React-based responsive frontend
* Infrastructure managed using Terraform
* Automated CI/CD pipeline using AWS CodePipeline and CodeBuild
* Static website hosting through Amazon S3 and CloudFront

---

## Technology Stack

### Frontend

* React
* JavaScript
* HTML5
* CSS3

### Backend

* AWS Lambda
* Python

### Cloud Services

* Amazon S3
* Amazon CloudFront
* Amazon API Gateway
* Amazon DynamoDB
* Amazon SNS
* AWS IAM

### Infrastructure as Code

* Terraform

### CI/CD & DevOps

* Git
* GitHub
* AWS CodePipeline
* AWS CodeBuild

---

## AWS Services Used

| Service      | Purpose                         |
| ------------ | ------------------------------- |
| S3           | Hosts React frontend            |
| CloudFront   | Content delivery and HTTPS      |
| API Gateway  | Exposes REST API endpoints      |
| Lambda       | Executes backend business logic |
| DynamoDB     | Stores leave requests           |
| SNS          | Notification service            |
| IAM          | Permissions and security        |
| CodeBuild    | Builds application code         |
| CodePipeline | Automates deployment            |
| Terraform    | Infrastructure provisioning     |

---

## Project Structure

```text
employee-leave-management-system/

├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── buildspec.yml
│
├── backend/
│   ├── lambda_function.py
│   └── buildspec.yml
│
├── terraform/
│   ├── api_gateway.tf
│   ├── dynamodb.tf
│   ├── lambda.tf
│   ├── s3_cloudfront.tf
│   ├── providers.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── version.tf
│
├── .gitignore
├── README.md
└── .terraform.lock.hcl
```

---

## Infrastructure Provisioning

Infrastructure is provisioned and managed using Terraform.

### Initialize Terraform

```bash
terraform init
```

### Validate Configuration

```bash
terraform validate
```

### Review Changes

```bash
terraform plan
```

### Deploy Infrastructure

```bash
terraform apply
```

---

## API Endpoint

### Submit Leave Request

```http
POST /leave
```

Example Request:

```json
{
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "leaveType": "Annual Leave",
  "startDate": "2025-08-01",
  "endDate": "2025-08-05"
}
```

---

## CI/CD Pipeline

The `.github/workflows/deploy.yml` pipeline runs on every push to the `main` branch:
1. Installs dependencies and runs linter checks.
2. Compiles the TypeScript code for the backend Lambdas and infrastructure.
3. Deploys updated AWS resources via `cdk deploy`.
4. Builds the frontend React app and uploads static files to S3, followed by a CloudFront invalidation for instant updates.
