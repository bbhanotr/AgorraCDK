const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const { Certificate } = require('aws-cdk-lib/aws-certificatemanager');
const { CfnOutput } = require('aws-cdk-lib');

class AlbStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpcId = cdk.Fn.importValue('VPCID');
    const instanceId = cdk.Fn.importValue('InstanceID');
    const certificateArn = cdk.Fn.importValue('ondc-buying-staging-CertificateARN'); // Correct export name
    const securityGroupId = cdk.Fn.importValue('ALBSecurityGroupID'); // Import the security group ID

    const vpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVPC', {
      vpcId: vpcId,
      availabilityZones: ['eu-west-1a', 'eu-west-1b'],
      publicSubnetIds: [cdk.Fn.importValue('PublicSubnet1Id'), cdk.Fn.importValue('PublicSubnet2Id')],
    });

    const certificate = Certificate.fromCertificateArn(this, 'Certificate', certificateArn);

    const alb = new elbv2.ApplicationLoadBalancer(this, 'AgorraALB', {
      vpc,
      internetFacing: true,
      securityGroup: ec2.SecurityGroup.fromSecurityGroupId(this, 'ALBSecurityGroupID', securityGroupId), // Use the imported security group
    });

    alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: elbv2.ApplicationProtocol.HTTPS,
        port: '443',
      }),
    });

    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate],
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: elbv2.ContentType.TEXT_PLAIN,
        messageBody: 'Hello from ALB',
      }),
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc,
      targets: [new elbv2.InstanceTarget(instanceId, 3000)],
      healthCheck: {
        path: '/',
        healthyHttpCodes: '200-299',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
      },
    });

    httpsListener.addTargetGroups('AddTargetGroup', {
      targetGroups: [targetGroup],
    });

    new CfnOutput(this, 'ALBDNSName', {
      value: alb.loadBalancerDnsName,
      description: 'The DNS name of the ALB',
      exportName: 'ALBDNSName',
    });

    new CfnOutput(this, 'ALBCanonicalHostedZoneID', {
      value: alb.loadBalancerCanonicalHostedZoneId,
      description: 'The canonical hosted zone ID of the ALB',
      exportName: 'ALBCanonicalHostedZoneID',
    });

    this.loadBalancerDnsName = alb.loadBalancerDnsName;
  }
}

module.exports = { AlbStack };