#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LeaveManagementStack } from '../lib/infrastructure-stack';

const app = new cdk.App();

new LeaveManagementStack(app, 'LeaveManagementStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1' 
  },
});
