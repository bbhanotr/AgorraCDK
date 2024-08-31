#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { AgoraStack } = require('../lib/agorra-stack');

// Ensure environment variables are set
const account = process.env.AWS_ACCOUNT_ID;
const region = process.env.AWS_REGION;

if (!account || !region) {
  console.error('Error: AWS_ACCOUNT_ID and AWS_REGION environment variables must be set.');
  process.exit(1);
}

const app = new cdk.App();

new AgoraStack(app, 'AgoraStack', {
  env: {
    account: account,
    region: region,
  },
});
