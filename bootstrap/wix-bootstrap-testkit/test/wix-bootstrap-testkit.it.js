'use strict';
const testkit = require('..'),
  expect = require('chai').expect,
  request = require('request'),
  envSupport = require('env-support');

describe('wix bootstrap testkit', function () {
  this.timeout(30000);

  describe('getUrl/getManagementUrl/env', () => {
    const app = testkit.bootstrapApp('./test/app/index.js', {env: envSupport.basic()});

    it('should return url matching env', () => {
      expect(app.getUrl()).to.equal(`http://localhost:${app.env.PORT}${app.env.MOUNT_POINT}`);
    });

    it('should merge provided url with base url', () => {
      expect(app.getUrl('zzz')).to.equal(`http://localhost:${app.env.PORT}${app.env.MOUNT_POINT}/zzz`);
    });

    it('should return url matching env', () => {
      expect(app.getManagementUrl()).to.equal(`http://localhost:${app.env.MANAGEMENT_PORT}${app.env.MOUNT_POINT}`);
    });

    it('should merge provided url with base management url', () => {
      expect(app.getManagementUrl('zzz')).to.equal(`http://localhost:${app.env.MANAGEMENT_PORT}${app.env.MOUNT_POINT}/zzz`);
    });
  });

  describe('defaults', () => {
    const app = testkit.bootstrapApp('./test/app/index.js');

    app.beforeAndAfter();

    it('should use default port/mount point', done => {
      request.get(`http://localhost:${app.env.PORT}${app.env.MOUNT_POINT}`, (err, res) => {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });
});