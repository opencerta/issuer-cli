function lowercase(currValue) {
  return currValue.toLowerCase();
}

function concat(value, previous) {
  return previous.concat([value]);
}

module.exports = { lowercase, concat };
