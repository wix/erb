const Composer = require('../../..').Composer;

new Composer()
  .express('./test/apps/express-app-composer/express-app-2-args')
  .start();
