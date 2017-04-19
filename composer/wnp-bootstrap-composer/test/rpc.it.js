const expect = require('chai').expect,
  testkit = require('./support/testkit'),
  http = require('wnp-http-test-client'),
  httpTestkit = require('wix-http-testkit'),
  rpcTestkit = require('wix-rpc-testkit'),
  statsdTestkit = require('wix-statsd-testkit'),
  {ErrorCode} = require('wix-errors'),
  _ = require('lodash'),
  eventually = require('wix-eventually');

describe('wix bootstrap rpc', function () {
  this.timeout(10000);

  const env = {
    RPC_SERVER_PORT: 3310, 
    RPC_TIMEOUT: 200,
    ENABLE_RPC_METRICS: true, //TODO: remove once fully enabled
    WIX_BOOT_STATSD_INTERVAL: 50
  };
  
  const app = testkit.server('rpc', env).beforeAndAfter();
  const statsd = statsdTestkit.server().beforeAndAfter();

  describe('rpc client with wix support', () => {
    const rpcServer = rpcTestkit.server({port: env.RPC_SERVER_PORT}).beforeAndAfter();

    it('provides rpc client with wix add-ons', () => {
      rpcServer.when('TestService', 'testMethod').respond((params, headers) => headers);

      return http.okGet(app.appUrl('/rpc/caller-id')).then(res => {
        expect(res.json()).to.contain.property('x-wix-rpc-caller-id').that.is.string('wix-bootstrap-composer:com.wixpress.npm@')
      });
    });
  });

  describe('rpc timeout set on composer', () => {
    const httpServer = httpTestkit.server({port: env.RPC_SERVER_PORT}).beforeAndAfter();

    it('should be respected', () => {
      httpServer.getApp().post('*', _.noop);
      const beforeCall = Date.now();

      return http.get(app.appUrl('/rpc/timeout'), http.accept.json).then(res => {
        expect(res.status).to.equal(500);
        expect(res.json()).to.contain.deep.property('errorCode', ErrorCode.RPC_ERROR);
        expect(Date.now() - beforeCall).to.be.within(150, 300);
      });
    });
  });
  
  describe('RPC client metrics', () => {
    const rpcServer = rpcTestkit.server({port: env.RPC_SERVER_PORT}).beforeAndAfter();
    
    it('should be reported for endpoint', () => {
      rpcServer.when('TestService', 'testMethod').respond(() => 'ok');
      
      return http.okGet(app.appUrl('/rpc/caller-id'))
        .then(() => eventually(() => {
          expect(statsd.events('tag=RPC_CLIENT.service=TestService.method=testMethod')).not.to.be.empty;
        }));
    });
  });
});
