function buildSignDigitalpenRequest(csrpem, orgName) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30); // 30-day validity
  const built = {
    csr_pem: csrpem,
    organization: orgName,
    expires_at: expirationDate.toISOString(),
    key_usage: {
      digital_signature: true
    },
    basic_constraints: {
      critical: true,
      is_ca: false,
      path_len_constraint: {
        is_set: false,
        len: 0
      }
    }
  };

  return built;
}

module.exports = { buildSignDigitalpenRequest };
