const axios = require("axios");
const fs = require("fs");
const forge = require("node-forge");
const { load, buffer2Pemtype } = require("./keypair");
const { buildSignDigitalpenRequest } = require("./builders");

const ORG_NAME = "CLI Demo";
const API_BASE_URL = "https://api.opencerta.org";
// const API_BASE_URL = "http://localhost:11000";

async function create(csrFile, cmd) {
  const keyId = cmd.keyId;
  const key = load(keyId);
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = key.publicKey;
  csr.setSubject([
    {
      name: "commonName",
      value: cmd.cn
    },
    {
      name: "countryName",
      value: cmd.country
    },
    {
      name: "organizationName",
      value: cmd.org
    }
  ]);

  // Subject Alternative Names
  const altNames = [
    // 6: URI
    { type: 6, value: ORG_NAME }
  ];
  if (cmd.email.length > 0) {
    const emailsAltName = cmd.email.map((e) => {
      return { type: 1, value: e };
    });
    altNames.push(...emailsAltName);
  }
  csr.setAttributes([
    {
      name: "extensionRequest",
      extensions: [
        {
          name: "subjectAltName",
          altNames: altNames
        }
      ]
    }
  ]);

  csr.sign(key.privateKey, forge.md.sha256.create());
  console.log("VALID CREATED CSR:", csr.verify());
  var pem = forge.pki.certificationRequestToPem(csr);
  fs.writeFileSync(csrFile, pem);
  console.log("SAVED", csrFile);
}

async function sign(certFile, { csrFile }) {
  try {
    const csrPem = fs.readFileSync(csrFile).toString("ascii");
    // const csr = forge.pki.certificationRequestFromPem(csrPem);
    const req = buildSignDigitalpenRequest(csrPem, ORG_NAME);
    console.log(req);
    const res = await axios.post(
      `${API_BASE_URL}/certas/v1/signupDigitalpen`,
      req
    );
    console.log("RESPONSE", res.data);
    var certPem = res.data.cert_pem;
    fs.writeFileSync(certFile, certPem);
  } catch (err) {
    throw err.response.data;
  }
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
