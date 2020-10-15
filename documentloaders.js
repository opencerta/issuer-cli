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
