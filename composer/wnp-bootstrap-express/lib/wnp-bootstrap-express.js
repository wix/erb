'use strict';
const express = require('express'),
  wixExpressErrorHandler = require('wix-express-error-handler'),
  wixExpressErrorCapture = require('wix-express-error-capture'),
  wixExpressTimeout = require('wix-express-timeout'),
  wixCachingPolicy = require('wix-express-caching-policy'),
  middlewaresComposer = require('wix-express-middleware-composer'),
  wixExpressAspects = require('wix-express-aspects'),
  biAspect = require('wix-bi-aspect'),
  petriAspect = require('wix-petri-aspect'),
  webContextAspect = require('wix-web-context-aspect'),
  wixSessionAspect = require('wix-session-aspect'),
  wixExpressErrorLogger = require('wix-express-error-logger');

module.exports = opts => (context, apps) => {
  const expressApp = express();

  expressApp.locals.newrelic = context.newrelic;
  //TODO: test this, as this is applicavle only for express.static
  expressApp.set('etag', false);

  expressApp.use(before(context, opts));
  apps.forEach(app => {
    //TODO: validate that app is provided
    if (app.locals) {
      app.locals.newrelic = context.newrelic;
    }
    expressApp.use(app);
  });
  expressApp.use(after());

  return expressApp;
};

function before(context, opts) {
  return middlewaresComposer.get(
    wixExpressAspects.get([
      biAspect.builder(),
      petriAspect.builder(),
      webContextAspect.builder(opts.seenBy),
      wixSessionAspect.builder(context.session)]),
    wixExpressErrorLogger,
    wixExpressTimeout.get(opts.timeout),
    wixExpressErrorCapture.async,
    wixCachingPolicy.defaultStrategy(),
    wixExpressErrorHandler.handler());
}

function after() {
  return wixExpressErrorCapture.sync;
}