const fs = require('fs');
const forge = require('node-forge');
const { load } = require('./keypair');

async function create(csrFile, cmd) {
  const keyId = cmd.keyId;
  const key = load(keyId);
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = key.publicKey;
  csr.setSubject([
    {
      name: 'commonName',
      value: cmd.cn
    },
    {
      name: 'countryName',
      value: cmd.country
    },
    {
      name: 'organizationName',
      value: cmd.org
    }
  ]);
  if (cmd.email.length > 0) {
    const emailsAltName = cmd.email.map((e) => {
      return { type: 1, value: e };
    });
    csr.setAttributes([
      {
        name: 'extensionRequest',
        extensions: [
          {
            name: 'subjectAltName',
            altNames: emailsAltName
          }
        ]
      }
    ]);
  }

  csr.sign(key.privateKey);
  console.log('VALID CREATED CSR:', csr.verify());
  var pem = forge.pki.certificationRequestToPem(csr);
  fs.writeFileSync(csrFile, pem);
  console.log('SAVED', csrFile);
}

async function sign(certFile, { csrFile, signingKeyId, issuer }) {
  const signingKey = load(signingKeyId);
  const csrPem = fs.readFileSync(csrFile);
  const csr = forge.pki.certificationRequestFromPem(csrPem);
  let issuerAttrs = csr.subject.attributes;

  if (issuer) {
    const certPem = fs.readFileSync(issuer);
    var issuerCert = forge.pki.certificateFromPem(certPem);
    issuerAttrs = issuerCert.subject.attributes;
  }

  if (!compareKeys(csr.publicKey, signingKey.publicKey)) {
    throw new Error('Supplied key and csr (or issuer cert) key must match');
  }

  const cert = forge.pki.createCertificate();
  cert.publicKey = csr.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  cert.setSubject(csr.subject.attributes);
  cert.setIssuer(issuerAttrs);
  var extensions = csr.getAttribute({ name: 'extensionRequest' }).extensions;
  extensions.push.apply(extensions, [
    {
      name: 'basicConstraints',
      cA: true
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true
    }
  ]);
  cert.setExtensions(extensions);
  cert.sign(signingKey.privateKey, forge.md.sha256.create());
  var certPem = forge.pki.certificateToPem(cert);
  fs.writeFileSync(certFile, certPem);
}

function compareKeys(k1, k2) {
  const n1 = k1.n;
  const n2 = k2.n;
  const nEq = n1.toString() === n2.toString();
  const e1 = k1.e;
  const e2 = k2.e;
  const eEq = e1.toString() === e2.toString();
  return nEq && eEq;
}

module.exports = { create, sign, compareKeys };
