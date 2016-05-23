'use strict';
const runMode = require('wix-run-mode'),
  log = require('wnp-debug')('wix-bootstrap-petri'),
  petri = require('./lib/wix-bootstrap-petri');

const configName = 'wix-bootstrap-petri';
const envVariable = 'WIX-BOOT-LABORATORY-URL';

module.exports.configName = configName;

module.exports.di = {
  key: 'petri',
  value: petriClientFactory,
  deps: ['rpc', 'config', 'session']
};

function petriClientFactory(context) {
  let laboratoryUrl;
  if (process.env[envVariable]) {
    laboratoryUrl = process.env[envVariable];
    log.debug(`env variable '${envVariable}' set to '${laboratoryUrl}', skipping loading from config`);
  } else if (runMode.isProduction()) {
    laboratoryUrl = context.config.load(configName).services.laboratory;
    log.debug(`production mode detected, loading laboratory url from config: ${context.env.confDir}/${configName}.json.erb`);
  } else {
    laboratoryUrl = 'http://localhost:3020';
    log.debug(`using default laboratory url for dev environment: ${laboratoryUrl}`);
  }

  return petri(context.rpc, laboratoryUrl);
}