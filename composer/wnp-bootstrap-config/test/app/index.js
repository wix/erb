'use strict';
const Composer = require('wnp-bootstrap-composer').Composer;

new Composer()
  .use(require('../..'))
  .config('./test/app/config')
  .express('./test/app/express')
  .start();
