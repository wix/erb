'use strict';
const validator = require('../lib/config-validator'),
  expect = require('chai').expect,
  _ = require('lodash'),
  configSupport = require('./support/config');

describe('config validator', () => {

  it('should pass for a valid object', () => {
    const config = configSupport.valid();
    expect(validator.validate(config)).to.deep.equal(config);
  });

  describe('should fail on root object:', () => {
    [null, undefined, {}, 1, ''].forEach(el => {
      it(`${el}`, () => {
        const res = validateNoThrow(el);
        expect(res).to.be.instanceof(Error);
        expect(res.message).to.be.string('config is mandatory');
      });
    });
  });

  describe('should fail on missing required objects:', () => {
    [
      'express',
      'express.requestTimeout',
      'session',
      'session.mainKey',
      'session.alternateKey',
      'rpc',
      'rpc.signingKey',
      'rpc.defaultTimeout',
      'requestContext.seenByInfo',
      'cluster.workerCount'
    ].forEach(el => {

      it(`${el}`, () => {
        const res = validateNoThrow(configSupport.without(el));
        expect(res).to.be.instanceof(Error);
        expect(res.message).to.be.string(_.last(el.split('.')));
      });
    });
  });

  describe('should fail on invalid types/unmet constraints:', () => {
    [
      withValue('express.requestTimeout', 'str'),
      withValue('express.requestTimeout', -1),
      withValue('express.requestTimeout', {}),
      withValue('session.mainKey', 1),
      withValue('session.mainKey', {}),
      withValue('session.mainKey', ''),
      withValue('session.alternateKey', 1),
      withValue('session.alternateKey', {}),
      withValue('session.alternateKey', ''),
      withValue('rpc.signingKey', 1),
      withValue('rpc.signingKey', {}),
      withValue('rpc.signingKey', ''),
      withValue('rpc.defaultTimeout', 'str'),
      withValue('rpc.defaultTimeout', -1),
      withValue('rpc.defaultTimeout', {}),
      withValue('requestContext.seenByInfo', 1),
      withValue('requestContext.seenByInfo', {}),
      withValue('cluster.workerCount', 0),
      withValue('cluster.workerCount', {})
    ].forEach(el => {

      it(`${el.desc}`, () => {
        const res = validateNoThrow(el.value);
        expect(res).to.be.instanceof(Error);
        expect(res.message).to.be.string(_.last(el.prop.split('.')));
      });
    });
  });
});

function withValue(prop, value) {
  return {
    prop,
    value: configSupport.withValue(prop, value),
    desc: `${prop} = ${value}`
  };
}

function validateNoThrow(conf) {
  try {
    validator.validate(conf);
    throw new Error('expected validation failure');
  } catch (e) {
    return e;
  }
}