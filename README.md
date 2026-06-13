# Employee Leave Management System

## Overview

The Employee Leave Management System is a serverless web application built on AWS that allows employees to submit leave requests through a React-based frontend. Leave requests are processed by AWS Lambda functions, stored in DynamoDB, and integrated with SNS notifications.

The project demonstrates modern cloud-native application development using Infrastructure as Code (Terraform), serverless architecture, and CI/CD automation using AWS DevOps services.

**Live Application:** [https://dnf1xg9sdrnw4.cloudfront.net](https://dnf1xg9sdrnw4.cloudfront.net)

---

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

This project implements Continuous Integration and Continuous Deployment using AWS CodePipeline and AWS CodeBuild.

![AWS CodePipeline CI/CD](ci-cd-screenshot.png)

### CI Workflow

```text
Developer
    │
    ▼
GitHub Repository
    │
    ▼
CodeBuild
    │
    ▼
npm install
    │
    ▼
npm run build
    │
    ▼
Build Artifact
```

### CD Workflow

```text
GitHub
    │
    ▼
CodePipeline
    │
    ▼
CodeBuild
    │
    ▼
S3 Deployment
    │
    ▼
CloudFront
```

### Deployment Process

1. Developer pushes code to GitHub.
2. GitHub webhook triggers CodePipeline.
3. CodePipeline retrieves the latest source code.
4. CodeBuild executes the build process.
5. React production build artifacts are generated.
6. Artifacts are deployed to Amazon S3.
7. CloudFront serves the latest application version.
8. Users access the updated application.

---

## Continuous Integration

The CI process automatically:

* Pulls source code from GitHub
* Installs dependencies
* Executes React build process
* Validates application build
* Generates deployment artifacts

---

## Continuous Deployment

The CD process automatically:

* Deploys build artifacts to S3
* Updates the hosted application
* Delivers content globally through CloudFront

---

## Security Considerations

* IAM roles follow least-privilege principles
* Infrastructure managed through Terraform
* Static content delivered through CloudFront
* Backend services isolated within AWS managed services
* No hardcoded credentials stored in source code

---

## Learning Objectives

This project demonstrates practical experience with:

* Cloud Architecture Design
* Serverless Computing
* Infrastructure as Code (IaC)
* AWS Core Services
* REST API Development
* Continuous Integration
* Continuous Deployment
* DevOps Practices
* Git Version Control
* Terraform Automation

---

## Future Enhancements

* User authentication using Amazon Cognito
* Leave approval workflow
* Email notifications
* Manager dashboard
* Leave balance tracking
* Audit logging
* Monitoring with CloudWatch
* Automated CloudFront cache invalidation
* Backend CI/CD automation for Lambda deployments

---

## Author

Built as a cloud-native portfolio project to demonstrate AWS, Terraform, Serverless Architecture, and DevOps CI/CD practices.
