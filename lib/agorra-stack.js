const cdk = require('aws-cdk-lib');
const { RouteConstructs } = require('agorra-construct-cdk'); // Import the route-constructs package
const route53 = require('aws-cdk-lib/aws-route53');

class AgoraStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Lookup existing Hosted Zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'agorra.biz',
    });

    // Define subdomains
    const subdomains = ['ondc-buying-staging'];

    // Use the custom RouteConstructs
    new RouteConstructs(this, 'RouteSetup', {
      hostedZone: hostedZone,
      subdomains: subdomains,
    });
  }
}

module.exports = { AgoraStack };