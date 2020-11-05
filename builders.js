// @opencerta/essentials
// Copyright (C) 2020 OpenCerta
//
// This library is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 3.0 of the License, or (at your option) any later version.
//
// This library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

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
