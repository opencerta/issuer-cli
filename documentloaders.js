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

const { extendContextLoader } = require("jsonld-signatures");
const { defaultDocumentLoader } = require("vc-js");
const contextCache = require("./contexts");
const axios = require("axios");

const customLoader = extendContextLoader(async (url) => {
  const myCustomContext = contextCache.get(url);
  if (myCustomContext) {
    return {
      contextUrl: null,
      documentUrl: url,
      document: myCustomContext
    };
  }

  return defaultDocumentLoader(url)
    .then((ctx) => {
      console.log("Fetched context from default loader", url);
      return ctx;
    })
    .catch(() => {
      console.log("Fetching context from URL", url);
      return axios.get(url);
    })
    .then((res) => {
      const document = res.data;
      contextCache.set(url, document);
      console.log("Added context from URL", url);
      return {
        contextUrl: null,
        document,
        documentUrl: url
      };
    });
});

module.exports = { defaultLoader: defaultDocumentLoader, customLoader };
