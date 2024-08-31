#
# README for Setting Up `AgoraStack`

This README provides instructions for setting up the `AgoraStack` in your AWS CDK workspace. Follow these steps to install `agorra-construct-cdk`, configure your stack, and deploy it.

## Overview

The `AgoraStack` is a CloudFormation stack defined using AWS CDK that sets up DNS records and SSL certificates for a subdomain under `agorra.biz`. It utilizes the `RouteConstructs` class from the `agorra-construct-cdk` package to handle the setup.



## Prerequisites

1. **Node.js**: Ensure Node.js is installed. You can download it from [Node.js official site](https://nodejs.org/)
2. **AWS CDK**: Ensure AWS CDK is installed. Install it globally using npm:
   ```bash
   npm install -g aws-cdk
 Welcome to your CDK JavaScript project
3. Pull AgorraConstructCDK in the same workspace 

This is a blank project for CDK development with JavaScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app. The build step is not required when using JavaScript.

## Useful commands

* `npm run test`         perform the jest unit tests
* `npx cdk deploy`       deploy this stack to your default AWS account/region
* `npx cdk diff`         compare deployed stack with current state
* `npx cdk synth`        emits the synthesized CloudFormation template
