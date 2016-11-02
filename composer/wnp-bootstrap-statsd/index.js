'use strict';
module.exports.di = {
  key: 'statsd',
  value: context => require('./lib/wnp-bootstrap-statsd')(context),
  deps: ['config'],
  bind: false,
};