'use strict';
const Composer = require('wnp-bootstrap-composer');

new Composer({composers: {mainExpress: () => require('wnp-bootstrap-express')()}})
  .use(require('wnp-bootstrap-config'))
  .use(require('wnp-bootstrap-session'))
  .use(require('../..'), {timeout: process.env.RPC_TIMEOUT})
  .config('./test/app/config')
  .express('./test/app/express')
  .start();