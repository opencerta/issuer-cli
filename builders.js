function buildSignDigitalpenRequest(csrpem, orgName) {
  const expirationDate = new Date();
  const expires_at_sec = Math.trunc(expirationDate.getTime() / 1000);
  const expires_at_ns =
    1000 * (expirationDate.getTime() - 1000 * expires_at_sec);
  const built = {
    csr_pem: csrpem,
    organization: orgName,
    expires_at: {
      seconds: expires_at_sec,
      nanos: expires_at_ns
    },
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
