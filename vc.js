const fs = require("fs");
const forge = require("node-forge");
const { createCanvas, loadImage } = require("canvas");
const {
  RSAKeyPair,
  sign: jsonldsign,
  verify: jsonldverify,
  suites: { RsaSignature2018 },
  purposes: { AssertionProofPurpose },
} = require("jsonld-signatures");
const { compareKeys } = require("./csr");
const { load } = require("./keypair");
const {
  newHealthCertificate,
  addPatientData,
  addPractitionerData,
} = require("./healthCertificate");
const { customLoader } = require("./documentloaders");

async function create(healthCertFile, opts) {
  // console.log(opts);
  const vc = newHealthCertificate(opts);
  const vcStr = JSON.stringify(vc, null, 2);
  fs.writeFileSync(healthCertFile, vcStr);
}

async function addPatient(healthCertFile, { photo, ...patientData }) {
  const vcStrIn = fs.readFileSync(healthCertFile);
  const vc = JSON.parse(vcStrIn);
  const img = await loadImage(photo[0]);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  patientData.photo = [canvas.toDataURL()];
  addPatientData(vc, patientData);
  const vcStrOut = JSON.stringify(vc, null, 2);
  fs.writeFileSync(healthCertFile, vcStrOut);
}

async function sign(
  healthCertFile,
  { signingKeyName, issuer, ...practitionerData }
) {
  const vcStrIn = fs.readFileSync(healthCertFile);
  const vc = JSON.parse(vcStrIn);
  if (vc.proof) {
    throw new Error("Health certificate has been already signed");
  }
  const key = load(signingKeyName);
  addPractitionerData(vc, practitionerData);

  const certPem = fs.readFileSync(issuer);
  const cert = forge.pki.certificateFromPem(certPem);
  const serialNbr = cert.serialNumber;
  const subjKeyId = cert.getExtension({
    name: "subjectKeyIdentifier",
  }).subjectKeyIdentifier;
  vc.issuanceDate = new Date().toISOString();
  vc.issuer = `https://example.edu/issuers/${serialNbr}/${subjKeyId}`;

  if (!compareKeys(key.publicKey, cert.publicKey)) {
    throw new Error("Supplied key and (issuer) cert key must match");
  }
  const keyPair = new RSAKeyPair(key);
  const suite = new RsaSignature2018({
    verificationMethod: vc.issuer,
    key: keyPair,
  });
  const signedVC = await jsonldsign(vc, {
    suite,
    documentLoader: customLoader,
    purpose: new AssertionProofPurpose(),
  });
  const vcStrOut = JSON.stringify(signedVC, null, 2);
  fs.writeFileSync(healthCertFile, vcStrOut);
}

async function validate(healthCertFile, { issuer }) {
  const vcStrIn = fs.readFileSync(healthCertFile);
  const vc = JSON.parse(vcStrIn);
  if (!vc.proof) {
    throw new Error("Health certificate has not been signed");
  }
  const certPem = fs.readFileSync(issuer);
  const cert = forge.pki.certificateFromPem(certPem);
  const key = { publicKeyPem: forge.pki.publicKeyToPem(cert.publicKey) };
  const keyId = vc.proof.verificationMethod;
  // console.log("LDKEY", key);
  const keyPair = new RSAKeyPair({ id: keyId, ...key });
  const suite = new RsaSignature2018({
    verificationMethod: keyId,
    key: keyPair,
  });
  const controller = {
    "@context": "https://w3id.org/security/v2",
    publicKey: [keyPair],
    assertionMethod: [keyId],
  };
  const verifyOpts = {
    suite,
    documentLoader: customLoader,
    purpose: new AssertionProofPurpose({ controller }),
  };
  // console.log("VERIFYOPTS", verifyOpts);
  const result = await jsonldverify(vc, verifyOpts);
  if (result.verified) {
    console.log("VALID");
  } else {
    console.log("INVALID:", result.error.errors);
  }
}

module.exports = { create, addPatient, sign, validate };
