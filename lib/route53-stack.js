const cdk = require('aws-cdk-lib');
const route53 = require('aws-cdk-lib/aws-route53');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const { RouteConstructs } = require('agorra-construct-cdk');

class Route53Stack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { hostedZoneName, domainNames } = props;

    // Import the hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: hostedZoneName,
    });

    // Import the ALB DNS name
    const albDnsName = cdk.Fn.importValue('ALBDNSName');

    // Import the ALB using its DNS name
    const alb = elbv2.ApplicationLoadBalancer.fromApplicationLoadBalancerAttributes(this, 'ALB', {
      loadBalancerArn: albDnsName, // Adjust as needed
    });

    // Use RouteConstructs to set up DNS records
    new RouteConstructs(this, 'RouteSetup', {
      hostedZone: hostedZone,
      domainNames: domainNames,
      alb: alb,
    });
  }
}

module.exports = { Route53Stack };