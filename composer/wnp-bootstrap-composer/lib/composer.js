const runMode = require('wix-run-mode'),
  log = require('wnp-debug')('wnp-bootstrap-composer'),
  buildFrom = require('./disabler'),
  shutdown = require('./shutdown'),
  initialContext = require('./context/initial-app-context'),
  resolveFilePath = require('./utils/resolve-file-path'),
  HealthManager = require('./health/manager'),
  _ = require('lodash'),
  health = require('./health'),
  beforeStart = require('./before-start'),
  buildAppContext = require('./context/app-context');

module.exports = class InnerComposer {
  constructor(opts) {
    const fromOptions = getFromOptions(opts);
    this._healthManager = new HealthManager(setTimeoutFn(fromOptions('health.forceDelay')));
    this._shutdown = new shutdown.Assembler(log);
    this._mainHttpAppFns = [];
    this._mainExpressAppFns = [() => health.isAlive(() => this._healthManager.status())];
    this._managementAppFns = [
      context => health.deploymentTest(context, () => this._healthManager.status()),
      context => health.stop(context, () => this._shutdown.emit()())];

    this._plugins = [];
    this._appConfigFn = () => context => Promise.resolve(context);
    this._mainExpressAppComposer = fromOptions('composers.mainExpress', defaultExpressAppComposer);
    this._managementExpressAppComposer = fromOptions('composers.managementExpress', defaultExpressAppComposer);
    this._runner = fromOptions('runner', passThroughRunner);
  }

  config(appConfigFnFile) {
    this._appConfigFn = buildRequireFunction(appConfigFnFile);
    return this;
  }

  use(plugin, opts) {
    this._plugins.push({plugin: plugin, opts: opts || {}});
    return this;
  }

  express(expressFnFile) {
    this._mainExpressAppFns.push(buildRequireFunction(expressFnFile));
    return this;
  }

  management(expressFnFile) {
    this._managementAppFns.push(buildRequireFunction(expressFnFile));
    return this;
  }

  http(httpFnFile) {
    this._mainHttpAppFns.push(buildRequireFunction(httpFnFile));
    return this;
  }

  start(opts) {
    const options = opts || {};
    const effectiveEnvironment = Object.assign({}, process.env, options.env);
    const disabled = buildFrom(effectiveEnvironment, options.disable);
    beforeStart(runMode, effectiveEnvironment, log).forEach(el => this._shutdown.addFunction(el.name, el.fn));
    const mainExpressAppComposer = (disabled.find(el => el === 'express')) ? defaultExpressAppComposer : this._mainExpressAppComposer;
    const managementAppComposer = (disabled.find(el => el === 'management')) ? defaultExpressAppComposer : this._managementExpressAppComposer;
    const runner = (disabled.find(el => el === 'runner')) ? passThroughRunner : this._runner;

    let appContext = initialContext(effectiveEnvironment);

    return runner(appContext)(() => {
      const mainHttpServer = asyncHttpServer();
      const managementHttpServer = asyncHttpServer();

      this._shutdown.addHttpServer('main http server', mainHttpServer);
      this._shutdown.addHttpServer('management http server', managementHttpServer);

      return buildAppContext(appContext, this._shutdown, this._plugins, this._healthManager)
        .then(context => appContext = context)
        .then(() => buildAppConfig(appContext, this._appConfigFn()))
        .then(appConfig => {
          const mainApps = [
            () => composeExpressApp(mainExpressAppComposer, appContext, appConfig, this._mainExpressAppFns),
            () => composeHttpApp(appContext, appConfig, this._mainHttpAppFns)];
          const managementApps = [() => composeExpressApp(managementAppComposer, appContext, appConfig, this._managementAppFns)];

          return Promise.all([
            attachAndStart(mainHttpServer, appContext.env.PORT, mainApps),
            attachAndStart(managementHttpServer, appContext.env.MANAGEMENT_PORT, managementApps)
          ]);
        })
        .then(() => log.info('\x1b[33m%s\x1b[0m ', `Host's URL is: http://${appContext.env.HOSTNAME}:${appContext.env.PORT}`))
        .then(() => this._healthManager.start())
        .then(() => this._shutdown.addFunction('health manager', () => this._healthManager.stop()))
        .catch(err => {
          log.error('Failed loading app');
          log.error(err);
          //TODO: best effort in clean-up
          return Promise.reject(err);
        })
        .then(() => this._shutdown.emit());
    });
  }
}

function buildAppConfig(context, appConfigFn) {
  return Promise.resolve(appConfigFn(context));
}

function composeHttpApp(context, config, appFns) {
  return Promise.resolve()
    .then(() => httpServer => Promise.all(appFns.map(appFn => appFn(context)(httpServer, config))));
}

function composeExpressApp(composer, context, config, appFns) {
  return Promise.all(appFns.map(appFn => {
    const withContext = appFn(context);
    if (withContext.length === 2) {
      return expressApp => withContext(expressApp, config);
    } else {
      return () => withContext(config);
    }
  }))
    .then(contextualizedAppFns => composer()(context, contextualizedAppFns))
    .then(composed => httpServer => {
      const app = aBlankExpressApp()
        .use(context.env.MOUNT_POINT, composed);
      httpServer.on('request', app)
    });
}

function attachAndStart(httpServer, port, composerFns) {
  return Promise.all(composerFns.map(composer => composer()))
    .then(composers => Promise.all(composers.map(composer => composer(httpServer))))
    .then(() => httpServer.listenAsync(port))
    .then(() => log.info(`Listening on ${port}`));
}

function asyncHttpServer() {
  return require('bluebird').promisifyAll(require('http').createServer());
}

function defaultExpressAppComposer() {
  return (context, appFns) => Promise.resolve().then(() => {
    const container = aBlankExpressApp();

    return Promise.all(appFns.map(appFn => Promise.resolve().then(() => appFn(aBlankExpressApp()))))
      .then(apps => apps.forEach(app => container.use(app)))
      .then(() => container);
  });
}

function passThroughRunner() {
  return thenable => thenable();
}

function aBlankExpressApp() {
  return require('express')().disable('x-powered-by');
}

function buildRequireFunction(filePath) {
  return () => require(resolveFilePath(process.cwd(), filePath))
}

function getFromOptions(opts) {
  return (key, fallback) => _.get(opts, key, fallback);
}

function setTimeoutFn(maybeForceDelay) {
  if (maybeForceDelay) {

    return fn => setTimeout(fn, maybeForceDelay);
  } else {
    return setTimeout;
  }
}