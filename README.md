# OpenCerta iCertas (Health Certificates) CLI

iCerta signed with a (X509) Certificate key.

## Commands

```
Commands:
  keypair|key <id>                               Create public and private signing key pair
  certification-request|csr [options] <csrFile>  Create CSR
  certificate|cert [options] <certFile>          Create certificate from CSR
  vc                                             Manage Health Certificates (verifiable credentials)
  help [command]                                 display help for command
```

## Example


0. Setup: Install required packages

`npm install`


1. Create a RSA key pair

`node index.js keypair keyName`

creates a RSA key pair (private.pem, public.pem) under the folder `keys/keyName`.


2. Create a X509 certificate

2.1. Create Certification Request (CSR)

`node index.js csr --keynName keyName --cn 'Practitioner Name' --org 'Organization Name' --country US --email practitioner@lab.organization.com csrFile.csr`


2.2. Create Certificate from CSR

`node index.js cert --csrFile csrFile.csr certificate.cert`


3. Create Health certificate (VC: Verifiable credential)


3.1. Create Immunization certificate

`node index.js vc create --type Immunization --status completed --lotNumber ABCDEF immunization.json`


3.2. Add Patient data to certificate

`node index.js vc patient --givenName First --familyName Last --photo samplepictures/patient1.jpg --gender male --birthDate 1977-09-10 immunization.json`

At least one photo is required. To add more photos, add as many `--photos <fileName>` as necessary:

`node index.js vc patient --givenName First --familyName Last --photo samplepictures/patient1.jpg --photo photo2.jpg --photo anotherphoto.png --gender male --birthDate 1977-09-10 immunization.json`

Calling `node index.js vc patient` several times for the same file will add more patients, but won't be referenced anywhere else within the document. Future versions might handle this behaviour properly.


3.3. Add practitioner data and sign

`node index.js vc sign --signingKeyName keyName --givenName PractitionerFirst --familyName PractitionerLast --prefix Dr. --issuer certificate.cert immunization.json`


4. (Optional): Validate signature with X509 certificate file public key

`node index.js vc validate --issuer certificate.cert immunization.json`
