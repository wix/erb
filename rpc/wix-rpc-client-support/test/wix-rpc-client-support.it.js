'use strict';
const expect = require('chai').expect,
  jvmTestkit = require('wix-jvm-bootstrap-testkit'),
  httpTestkit = require('wix-http-testkit'),
  wixExpressDomain = require('wix-express-domain'),
  wixRpcClientSupport = require('..'),
  rpcClient = require('json-rpc-client'),
  uuidSupport = require('uuid-support'),
  request = require('request');


//TODO: use more sophisticated request with petri, reqContext, etc. - it should be added to wix-http-testkit
describe('wix rpc client', function () {
  this.timeout(240000);
  let rpcServer = anRpcServer();
  let httpServer = aServer(rpcServer);

  rpcServer.beforeAndAfter();
  httpServer.beforeAndAfter();

  it('should invoke rpc service endpoint providing full service url to client', done => {
    request(httpServer.getUrl('hello'), (error, response, body) => {
      expect(response.statusCode).to.equal(200);
      expect(JSON.parse(body)).to.deep.equal({
        name: 'John',
        email: 'doe@wix.com'
      });
      done();
    });
  });

  it('should invoke rpc service endpoint allowing client to build url from servie url + service name', done => {
    request(httpServer.getUrl('mapped-hello'), (error, response, body) => {
      expect(response.statusCode).to.equal(200);
      expect(JSON.parse(body)).to.deep.equal({
        name: 'John',
        email: 'doe@wix.com'
      });
      done();
    });
  });


  it('should invoke rpc service endpoint with void return type', done => {
    request(httpServer.getUrl('invokeMethodWithVoid'), (error, response, body) => {
      expect(response.statusCode).to.equal(200);
      expect(body).to.equal('ok');
      done();
    });
  });

  function anRpcServer() {
    let server = jvmTestkit.server({
      artifact: {
        groupId: 'com.wixpress.node',
        artifactId: 'wix-rpc-server',
        version: '1.0.0-SNAPSHOT'
      }
    });

    return server;
  }

  function aServer(rpcServer) {
    let server = httpTestkit.server();
    let app = server.getApp();

    app.use(wixExpressDomain);

    const rpcFactory = rpcClient.factory();
    wixRpcClientSupport.get({rpcSigningKey: '1234567890'}).addTo(rpcFactory);
    const clientWithFullUrl = rpcFactory.client(rpcServer.getUrl() + '/RpcServer');
    const clientMappedUrl = rpcFactory.client(rpcServer.getUrl(), 'RpcServer');

    function sendError(response, error) {
      response.status(500).send({
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }

    //TODO: add fail as well
    app.get('/hello', (req, res) => {
      clientWithFullUrl.invoke('hello', uuidSupport.generate()).then(
          resp => res.send(resp),
          err => sendError(res, err)
      );
    });

    app.get('/mapped-hello', (req, res) => {
      clientMappedUrl.invoke('hello', uuidSupport.generate()).then(
        resp => res.send(resp),
        err => sendError(res, err)
      );
    });

    app.get('/invokeMethodWithVoid', (req, res) => {
      clientWithFullUrl.invoke('methodWithVoid').then(
          resp => res.send('ok'),
          err => sendError(res, err)
      );
    });

    return server;
  }
});