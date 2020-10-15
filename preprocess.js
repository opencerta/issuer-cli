function lowercase(currValue, dummyVal) {
  return currValue.toLowerCase();
}

function concat(value, previous) {
  return previous.concat([value]);
}

module.exports = { lowercase, concat };
