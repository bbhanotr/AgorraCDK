const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const route53 = require('aws-cdk-lib/aws-route53');
const { RouteConstructs } = require('agorra-construct-cdk'); // Update path

class AgoraStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Lookup existing Hosted Zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'agorra.biz',
    });

    // Define subdomains
    const subdomains = ['ondc-buying-staging'];

    // Create a VPC (Virtual Private Cloud)
    const vpc = new ec2.Vpc(this, 'AgorraVPC', {
      maxAzs: 3,
      natGateways: 1
    });

    // Create a Security Group
    const securityGroup = new ec2.SecurityGroup(this, 'AgorraSecurityGroup', {
      vpc: vpc,
      allowAllOutbound: true,
    });

    // Allow HTTP traffic
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');

    // Define key pair name
    const keyPairName = this.getKeyPairName();

    // Create an EC2 instance
    const ec2Instance = new ec2.Instance(this, 'AgorraEC2Instance', {
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: new ec2.AmazonLinuxImage(),
      vpc: vpc,
      keyName: keyPairName,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PUBLIC }],
      securityGroup: securityGroup,
      userData: ec2.UserData.custom(`
        #!/bin/bash

        # Update packages
        yum update -y

        # Install Docker
        amazon-linux-extras install docker -y
        service docker start
        usermod -a -G docker ec2-user
        systemctl enable docker

        # Pull Docker image
        docker pull bbhanotr/ondc-on-subscriber

        # Run Docker container
        docker run -d \
          --name ondc-subscriber \
          -p 3000:3000 \
          bbhanotr/ondc-on-subscriber

        # Install and configure Nginx
        amazon-linux-extras install nginx1 -y
        systemctl start nginx
        systemctl enable nginx

        # Write Nginx configuration
        echo 'server {
          listen 80;
          server_name ondc-buying-staging.agorra.biz;

          location / {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
          }
        }' > /etc/nginx/conf.d/default.conf

        systemctl restart nginx
      `),
    });

    // Output the EC2 instance public IP
    new cdk.CfnOutput(this, 'EC2PublicIP', {
      value: ec2Instance.instancePublicIp,
      description: 'The public IP address of the EC2 instance',
    });

    // Use RouteConstructs and pass the EC2 instance
    new RouteConstructs(this, 'RouteSetup', {
      hostedZone: hostedZone,
      subdomains: subdomains,
      ec2InstanceId: ec2Instance.instanceId, // Pass instance ID instead of IP
    });
  }

  getKeyPairName() {
    return 'MyNewKeyPair'; // Replace with actual key pair name or retrieval logic
  }
}

module.exports = { AgoraStack };