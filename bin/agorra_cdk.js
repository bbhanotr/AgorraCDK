#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { Ec2Stack } = require('../lib/ec2-stack');
const { AcmStack } = require('../lib/acm-stack');
const { AlbStack } = require('../lib/alb-stack');
const { Route53Stack } = require('../lib/route53-stack');

const app = new cdk.App();

const account = process.env.AWS_ACCOUNT_ID;
const region = process.env.AWS_REGION;

if (!account || !region) {
  console.error('Error: AWS_ACCOUNT_ID and AWS_REGION environment variables must be set.');
  process.exit(1);
}

const env = { account, region };

const hostedZoneName = 'agorra.biz';
const domainNames = ['ondc-buying-staging.agorra.biz'];

// Create the EC2 Stack
const ec2Stack = new Ec2Stack(app, 'Ec2Stack', { env });

// Create the ACM Stack
const acmStack = new AcmStack(app, 'AcmStack', { 
  env,
  hostedZoneName,
  domainNames,
});

// Create the ALB Stack
const albStack = new AlbStack(app, 'AlbStack', {
  env,
  ec2Instance: ec2Stack.ec2Instance,
});

// Create the Route 53 Stack
const route53Stack = new Route53Stack(app, 'Route53Stack', {
  env,
  hostedZoneName,
  domainNames,
});

// Set up dependencies
albStack.addDependency(ec2Stack);
albStack.addDependency(acmStack);
route53Stack.addDependency(albStack);

app.synth();