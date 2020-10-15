function newHealthCertificate({ type, status, lotNumber, result }) {
  console.log("Create", type, status, lotNumber, result);
  const today = new Date();
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  const vc = vcTypes[type];
  if (!vc) {
    throw new Error('Type must be one of "Immunization" or "DiagnosticReport"');
  }
  vc.credentialSubject.resourceType = type;
  vc.credentialSubject.status = status;
  if (type == "Immunization") {
    vc.credentialSubject.lotNumber = lotNumber;
    vc.credentialSubject.date = today.toISOString();
    vc.credentialSubject.expirationDate = expirationDate.toISOString();
  } else if (type == "DiagnosticReport") {
    // Specimen
    const specimen = {
      resourceType: "Specimen",
      id: "specimen1",
      type: {
        coding: [
          {
            system: "https://www.questd.com/codes",
            code: "KP615943B",
            display: "Specimen collection"
          }
        ],
        text: "Specimen collection"
      },
      receivedTime: today.toISOString(),
      collection: {
        collectedDateTime: today.toISOString()
      }
    };
    vc.credentialSubject.contained.push(specimen);
    vc.credentialSubject.specimen = [
      {
        reference: "#specimen1",
        type: "Specimen"
      }
    ];
    // Observation
    const observation = {
      resourceType: "Observation",
      id: "r1",
      status: "final",
      code: {
        coding: [
          {
            system: "https://www.questd.com/codes",
            code: "AZD1222",
            display: "serology results"
          }
        ],
        text: "serology results"
      },
      valueString: result,
      comment: resultComment[result]
    };
    vc.credentialSubject.contained.push(observation);
    vc.credentialSubject.result = [
      {
        reference: "#r1",
        type: "Observation"
      }
    ];
  }

  return vc;
}

function addPatientData(
  vc,
  { givenName, familyName, photo, gender, birthDate }
) {
  if (photo.length == 0) {
    throw new Error("At least one photo must be provided");
  }
  // Patient
  const patient = {
    resourceType: "Patient",
    id: "p1",
    name: [{ family: familyName, given: [givenName] }],
    photo: photo.map((p) => {
      return { data: p };
    })
  };
  if (gender) {
    patient.gender = gender;
  }
  if (birthDate) {
    patient.birthDate = birthDate;
  }
  vc.credentialSubject.contained.push(patient);
  const patientRef = { reference: "#p1", type: "Patient" };

  // Patient -- Immunization
  if (vc.credentialSubject.resourceType == "Immunization") {
    vc.credentialSubject.patient = patientRef;
  }

  // Patient -- DiagnosticReport
  else if (vc.credentialSubject.resourceType == "DiagnosticReport") {
    vc.credentialSubject.subject = patientRef;
    const specimen = getById(vc.credentialSubject.contained, "specimen1");
    if (!specimen) {
      throw new Error(
        "Malformed document: credentialSubject.contained does not contain specimen"
      );
    }
    specimen.subject = patientRef;
    const observation = getById(vc.credentialSubject.contained, "r1");
    if (!observation) {
      throw new Error(
        "Malformed document: credentialSubject.contained does not contain observation"
      );
    }
    observation.subject = patientRef;
  }
}

function addPractitionerData(vc, { givenName, familyName, prefix }) {
  const practitionerName = { family: familyName, given: [givenName] };
  if (prefix) {
    practitionerName.prefix = [prefix];
  }
  const practitioner = {
    resourceType: "practitioner1",
    id: "Dr.1",
    name: [practitionerName]
  };
  vc.credentialSubject.contained.push(practitioner);
  const practitionerRef = { id: "#performer1" };

  // Practitioner -- Immunization
  if (vc.credentialSubject.resourceType == "Immunization") {
    practitionerRef.actor = { reference: "#practitioner1" };
    vc.credentialSubject.practitioner = [practitionerRef];
  }

  // Practitioner -- DiagnosticReport
  else if (vc.credentialSubject.resourceType == "DiagnosticReport") {
    practitionerRef.actor = { reference: "#org1" };
    vc.credentialSubject.performer = practitionerRef;
    const observation = getById(vc.credentialSubject.contained, "r1");
    if (!observation) {
      throw new Error(
        "Malformed document: credentialSubject.contained does not contain observation"
      );
    }
    observation.performer = practitionerRef;
  }
}

const resultComment = {
  Positive: "Low IgG antibodies to SARS-CoV-2 (COVID-19).",
  Negative:
    "Detection of IgG antibodies may indicate exposure to SARS-CoV-2 (COVID-19). It usually takes at least 10 days after symptom onset for IgG to reach detectable levels. An IgG positive result may suggest an immune response to a primary infection with SARS-CoV-2, but the relationship between IgG positivity and immunity to SARS-CoV-2 has not yet been firmly established. Antibody tests have not been shown to definitively diagnose or exclude SARS CoV-2 infection. Diagnosis of COVID-19 is made by detection of SARS-CoV-2 RNA by molecular testing methods, consistent with a patient's clinical findings. This test has not been reviewed by the FDA. Negative results do not rule out SARS-CoV-2 infection particularly in those who have been in contact with the virus. Follow-up testing with a molecular diagnostic should be considered to rule out infection in these individuals. Results from antibody testing should not be used as the sole basis to diagnose or exclude SARS-CoV-2 infection or to inform infection status. Positive results could also be due to past or present infection with non-SARS-CoV-2 coronavirus strains, such as coronavirus HKU1, NL63, OC43, or 229E. This test is not to be used for the screening of donated blood."
};

const immunizationCertificate = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://digitalinclusionfoundation.org/Immunization/v1"
  ],
  type: ["VerifiableCredential", "Immunization"],
  credentialSubject: {
    contained: [
      {
        resourceType: "Organization",
        id: "manufacturer1",
        name: "AstraZeneca; The University of Oxford; IQVIA"
      },
      {
        resourceType: "Location",
        id: "address1",
        address: { city: "Houston", state: "TX", country: "US" }
      }
    ],
    vaccineCode: {
      coding: [{ system: "urn:oid:1.2.36.1.2001.1005.17", code: "COVID-19" }],
      text: "Covid-19 (Coronavirus SARS-CoV-2)"
    },
    primarySource: true,
    manufacturer: { reference: "#manufacturer1", type: "Organization" },
    location: { reference: "#address1", type: "Location" }
  }
};

const diagnosticReport = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://digitalinclusionfoundation.org/DiagnosticReport/v1"
  ],
  type: ["VerifiableCredential", "DiagnosticReport"],
  credentialSubject: {
    contained: [
      {
        resourceType: "Organization",
        id: "org1",
        name: "QUEST DIAGNOSTICS",
        address: [
          {
            city: "MEDFORD",
            state: "NJ",
            country: "US"
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: "https://www.questd.com/codes",
          code: "AZD1222",
          display: "SARS-CoV-2 serology test"
        }
      ],
      text: "SARS-CoV-2 serology test"
    }
  }
};

const vcTypes = {
  Immunization: immunizationCertificate,
  DiagnosticReport: diagnosticReport
};

module.exports = { newHealthCertificate, addPatientData, addPractitionerData };

function getById(objArr, id) {
  var found = false;
  objArr.forEach((obj) => {
    if (obj.id === id) {
      found = obj;
    }
  });
  return found;
}
