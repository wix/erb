var Chance = require('chance');
var chance = new Chance();

describe("server", function () {

  var port = 3333;

  var server = require('http-test-kit').testApp({port: port});
  var request = require('request');
  var expect = require('chai').expect;
  var builders = require('./builders');
  var wixSession = require('wix-session')({mainKey: builders.key()});
  var wixDomain = require('wix-express-domain');
  var cookiesUtils = require('cookies-utils');

  // naming convention - service should be a singleton in a real app
  var requireLoginService = require('../wix-express-session')(wixSession);

  function invalidSessionHandler(res) {
    res.send('from-callback');
  }

  server.getApp().use(wixDomain.wixDomainMiddleware());
  server.getApp().use('/requireLogin', requireLoginService.requireLogin());
  server.getApp().use('/requireLoginCallback', requireLoginService.requireLoginWithCallback(invalidSessionHandler));

  server.getApp().get('/requireLogin', function (req, res) {
    res.send(requireLoginService.wixSession().userGuid);
  });  

  server.getApp().get('/notRequireLogin', function (req, res) {
    res.send("no need to login");
  });


  var base_url = 'http://localhost:' + port;

  describe("Session support middleware", function () {

    server.beforeAndAfterEach();

    it("not require login should get 200", function (done) {
      request.get(base_url + "/notRequireLogin", function (error, response, body) {
        expect(response.statusCode).to.equal(200);
        // validate no need to login
        done();
      });
    });

    it("require login without wixSession should be rejected", function (done) {
      request.get(base_url + "/requireLogin", function (error, response, body) {
        expect(response.statusCode).to.equal(401);
        done();
      });
    });

    it("require login with custom callback without wixSession should be rejected", function (done) {
      request.get(base_url + "/requireLoginCallback", function (error, response, body) {
        expect(response.body).to.equal('from-callback');
        done();
      });
    });

    it("require login without should return user id", function (done) {
      var session = sessionBuilder();
      var cookie = cookiesUtils.toHeader({wixSession: wixSession.sessionToToken(session)});
      var options = {
        uri: base_url + "/requireLogin",
        method: 'GET',
        headers: {
          Cookie: cookie
        }
      };
      request.get(options, function (error, response, body) {
        expect(response.statusCode).to.equal(200);
        expect(body).to.equal(session.userGuid);
        done();
      });
    });

  });
});

var sessionBuilder = function () {
  return {
    uid: chance.integer(),
    permissions: randomString(),
    userGuid: chance.guid(),
    userName: randomString(),
    email: randomString() + "@somedomain.com",
    mailStatus: randomString(),
    userAgent: randomString(),
    isWixStaff: chance.bool(),
    isRemembered: chance.bool(),
    expiration: chance.date(),
    userCreationDate: chance.date(),
    version: 1,
    colors: {}
  };

};

var randomString = function () {
  return chance.string().replace("#", "");
};


    