const cdk = require('aws-cdk-lib');
const route53 = require('aws-cdk-lib/aws-route53');
const acm = require('aws-cdk-lib/aws-certificatemanager');

class AcmStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { hostedZoneName, domainNames } = props;

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: hostedZoneName,
    });

    this.certificates = {};

    domainNames.forEach(domainName => {
      const certificate = new acm.Certificate(this, `${domainName.replace(/\./g, '-')}Cert`, {
        domainName: domainName,
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });

      this.certificates[domainName] = certificate;

      new cdk.CfnOutput(this, `${domainName.replace(/\./g, '-')}CertificateARN`, {
        value: certificate.certificateArn,
        description: `The ARN of the SSL certificate for ${domainName}`,
        exportName: `ondc-buying-staging-CertificateARN`, // Correct export name
      });
    });
  }
}

module.exports = { AcmStack };