'use strict';
const _ = require('lodash'),
  testkit = require('wix-childprocess-testkit'),
  join = require('path').join;

const port = testkit.env.randomPort();
const DEFAULT_OPTIONS = {
  env: {
    PORT: port,
    MANAGEMENT_PORT: port + 4,
    MOUNT_POINT: '/app',
    APP_NAME: 'app'
  }
};

module.exports.bootstrapApp = (app, options) => new BootstrapApp(app, options);

function BootstrapApp(app, options) {
  const opts = _.merge(_.clone(DEFAULT_OPTIONS, true), options || {});
  const embeddedApp = testkit.embeddedApp(app, opts, testkit.checks.httpGet('/health/is_alive'));

  this.beforeAndAfter = () => embeddedApp.beforeAndAfter();

  this.getUrl = (path) => {
    const completePath = join(opts.env.MOUNT_POINT, path || '');
    return `http://localhost:${opts.env.PORT}${completePath}`;
  };

  this.getManagementUrl = (path) => {
    const completePath = join(opts.env.MOUNT_POINT, path || '');
    return `http://localhost:${opts.env.MANAGEMENT_PORT}${completePath}`;
  };

  this.stdout = () => embeddedApp.stdout();
  this.stderr = () => embeddedApp.stderr();

  this.env = opts.env;
}