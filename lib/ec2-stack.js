const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const { CfnOutput } = require('aws-cdk-lib');

class Ec2Stack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'AgorraVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const securityGroup = new ec2.SecurityGroup(this, 'AgorraSecurityGroup', {
      vpc: vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic');

    const keyPairName = this.getKeyPairName();

    const ec2Instance = new ec2.Instance(this, 'AgorraEC2Instance', {
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpc: vpc,
      keyName: keyPairName,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PUBLIC }],
      securityGroup: securityGroup,
      userData: ec2.UserData.custom(`
        #!/bin/bash
        set -e

        # Update and install dependencies
        yum update -y
        amazon-linux-extras install docker nginx1 -y

        # Configure and start Docker
        systemctl enable docker
        systemctl start docker
        usermod -a -G docker ec2-user

        # Pull and run the Docker container
        docker pull bbhanotr/ondc-on-subscriber:x86_64
        docker run -d --name ondc-subscriber -p 3000:3000 \
          -e PORT=${process.env.PORT || 3000} \
          -e ENCRYPTION_PRIVATE_KEY="${process.env.ENCRYPTION_PRIVATE_KEY}" \
          -e ONDC_PUBLIC_KEY="${process.env.ONDC_PUBLIC_KEY}" \
          -e REQUEST_ID="${process.env.REQUEST_ID}" \
          -e SIGNING_PRIVATE_KEY="${process.env.SIGNING_PRIVATE_KEY}" \
          bbhanotr/ondc-on-subscriber:x86_64

        # Configure and start Nginx
        cat << EOF > /etc/nginx/conf.d/default.conf
        server {
          listen 80;
          server_name ondc-buying-staging.agorra.biz;
          location / {
            proxy_pass http://localhost:3000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
          }
        }
        EOF

        systemctl enable nginx
        systemctl start nginx

        # Signal the CloudFormation stack that the instance is ready
        /opt/aws/bin/cfn-signal -e $? --stack ${this.stackName} --resource AgorraEC2Instance --region ${this.region}
      `),
    });

    new CfnOutput(this, 'EC2PublicIP', {
      value: ec2Instance.instancePublicIp,
      description: 'The public IP address of the EC2 instance',
      exportName: 'EC2PublicIP',
    });

    new CfnOutput(this, 'VPCID', {
      value: vpc.vpcId,
      description: 'The VPC ID',
      exportName: 'VPCID',
    });

    new CfnOutput(this, 'InstanceID', {
      value: ec2Instance.instanceId,
      description: 'The EC2 instance ID',
      exportName: 'InstanceID',
    });

    // Export the security group ID
    new CfnOutput(this, 'ALBSecurityGroupID', {
      value: securityGroup.securityGroupId,
      exportName: 'ALBSecurityGroupID',
    });

    vpc.publicSubnets.forEach((subnet, index) => {
      new CfnOutput(this, `PublicSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        exportName: `PublicSubnet${index + 1}Id`,
      });
    });

    this.ec2Instance = ec2Instance;
  }

  getKeyPairName() {
    return 'MyNewKeyPair'; // Replace with actual key pair name or retrieval logic
  }
}

module.exports = { Ec2Stack };