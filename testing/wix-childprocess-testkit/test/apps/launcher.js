'use strict';
var app = require('./app'),
  wixClusterBuilder = require('wix-cluster').builder,
  testNotifier = require('../../index').testNotifierPlugin;

wixClusterBuilder(app)
  .withWorkerCount(1)
  .addPlugin(testNotifier())
  .start();