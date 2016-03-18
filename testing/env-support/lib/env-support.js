'use strict';
const _ = require('lodash');

module.exports.basic = obj => _.merge({}, basicEnv(), obj || {});
module.exports.bootstrap = obj => _.merge({}, bootstrapEnv(), obj || {});
function basicEnv() {
  const port = _.random(3000, 3996);
  return {
    PORT: port,
    MOUNT_POINT: '/app',
    APP_NAME: 'app',
    MANAGEMENT_PORT: port + 4
  };
}

function bootstrapEnv() {
  return {
    PORT: 3000,
    MANAGEMENT_PORT: 3004,
    MOUNT_POINT: '',
    APP_CONF_DIR: './test/configs',
    NEW_RELIC_ENABLED: false,
    NEW_RELIC_NO_CONFIG_FILE: true,
    NEW_RELIC_LOG: 'stdout'
  };
}