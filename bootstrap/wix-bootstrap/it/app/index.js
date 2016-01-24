'use strict';
const bootstrap = require('../..');

bootstrap.setup({
  express: {
    requestTimeout: 1000
  },
  session: {
    mainKey: '1qaz2wsx3edc4rfv',
    alternateKey: '1qaz2wsx3edc4rfv'
  },
  rpc: {
    signingKey: '1234567890',
    defaultTimeout: 700
  },
  requestContext: {
    seenByInfo: 'seen-by-Villus'
  }
});

bootstrap.run(() => require('./app'));