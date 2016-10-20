const retry = require('retry-promise').default;

module.exports = fn => retry({max: 3}, () => Promise.resolve().then(fn));