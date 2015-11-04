'use strict';
const expect = require('chai').expect,
  compose = require('..'),
  httpTestkit = require('wix-http-testkit'),
  request = require('request');

describe('wix express middleware composer integration', () => {
  const events = [],
    server = aServer();

  server.beforeAndAfter();

  it('should call composed middlewares within express app', done => {
    request(server.getUrl(), (error, resp) => {
      expect(resp.body).to.equal('m1 m2');
      done();
    });
  });

  function aMiddleware(index) {
    return (req, res, next) => {
      events.push(`m${index}`);
      next();
    };
  }

  function aServer() {
    const server = httpTestkit.httpServer();
    const app = server.getApp();

    app.use(compose(aMiddleware(1), aMiddleware(2)));
    app.get('/', (req, res) => {
      res.end(events.join(' '));
    });

    return server;
  }
});





