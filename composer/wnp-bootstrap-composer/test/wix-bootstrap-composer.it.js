'use strict';
const testkit = require('./support/testkit'),
  expect = require('chai').use(require('chai-as-promised')).expect,
  fetch = require('node-fetch'),
  WebSocket = require('ws');

describe('wix bootstrap composer', function () {
  this.timeout(10000);

  describe('blank', () => {
    const app = testkit.app('blank').beforeAndAfter();

    it('should start app that responds to "/health/is_alive" on app port as per ops contract', () =>
      aGet(app.appUrl('/health/is_alive'))
    );

    it('should start app that responds to "/health/deployment/test" on management app port as per ops contract', () =>
      aGet(app.managementAppUrl('/health/deployment/test'))
    );
  });

  describe('config', () => {
    const app = testkit.app('config', {PORT: 4000}).beforeAndAfter();

    it('should allow to have config function that receives context and its return value is passed to app', () =>
      aJsonGet(app.appUrl('/config'))
        .then(res => expect(res.json).to.deep.equal({port: '4000', customKey: 'customValue'}))
    );
  });

  describe('express', () => {
    const app = testkit.app('express').beforeAndAfter();

    it('should allow to add express app and mount it onto main app port and mount point', () =>
      aGet(app.appUrl('/custom')).then(res => expect(res.text).to.equal('custom'))
    );
  });

  describe('http', () => {
    testkit.app('http', {PORT: 3000, MOUNT_POINT: '/'}).beforeAndAfter();

    it('should allow to serve websockets app', done => {
      const wsClient = new WebSocket('ws://localhost:3000', 'echo-protocol');
      wsClient.on('message', data => {
        expect(data).to.equal('something');
        done();
      });
      wsClient.on('open', () => wsClient.send('something'));
    });
  });

  describe('management', () => {
    const app = testkit.app('management').beforeAndAfter();

    it('should allow to add express app and mount it onto management app port and mount point', () =>
      aGet(app.managementAppUrl('/custom')).then(res => expect(res.text).to.equal('custom-from-management'))
    );
  });

  describe('plugin', () => {
    const app = testkit.app('plugin').beforeAndAfter();

    it('should allow to have config function that receives context and its return value is passed to app', () =>
      aJsonGet(app.appUrl('/plugin'))
        .then(res => expect(res.json).to.deep.equal({plugin: 'custom-plugin'}))
    );
  });

  describe('plugin-with-opts', () => {
    const app = testkit.app('plugin-with-opts').beforeAndAfter();

    it('should allow to have config function that receives context and its return value is passed to app', () =>
      aJsonGet(app.appUrl('/plugin'))
        .then(res => expect(res.json).to.deep.equal({plugin: 'custom-plugin with opts'}))
    );
  });


  describe('express-app-composer', () => {
    const app = testkit.app('express-app-composer').beforeAndAfter();

    it('should allow to provide custom main express app composer (ex. adds custom header to all responses)', () =>
      aGet(app.appUrl('/composer'))
        .then(res => {
          expect(res.res.headers.get('warning')).to.equal('from composer');
          expect(res.text).to.equal('composer')
        })
    );
  });

  describe('management-app-composer', () => {
    const app = testkit.app('management-app-composer').beforeAndAfter();

    it('should allow to provide custom management express app composer (that exposes custom endpoint)', () =>
      aGet(app.managementAppUrl('/custom-resource'))
        .then(res => expect(res.text).to.equal('ok'))
    );
  });

  describe('runner', () => {
    const app = testkit.app('runner').beforeAndAfter();

    it('should allow to provide custom app runner', () =>
      aGet(app.appUrl('/health/is_alive'))
        .then(() => expect(app.stdouterr()).to.be.string('Custom runner booted an app'))
    );
  });

  describe('context', () => {
    const app = testkit.app('context', {
      PORT: 3000,
      MANAGEMENT_PORT: 3004,
      MOUNT_POINT: '/context',
      APP_LOG_DIR: './target/logs',
      APP_CONF_DIR: './target/configs',
      APP_TEMPL_DIR: './templates',
      HOSTNAME: 'some-host'
    }).beforeAndAfter();

    it('should expose port, managementPort, mountPoint, logDir via context.env', () =>
      aJsonGet(app.appUrl('/env'))
        .then(res => expect(res.json).to.deep.equal({
          port: '3000',
          managementPort: '3004',
          mountPoint: '/context',
          logDir: './target/logs',
          confDir: './target/configs',
          templDir: './templates',
          hostname: 'some-host'
        })));

    it('should expose name, version via context.app', () =>
      aJsonGet(app.appUrl('/app'))
        .then(res => expect(res.json).to.deep.equal({
          name: 'wnp-bootstrap-composer',
          version: '0.0.1'
        })));

    it('should expose newrelic context.newrelic', () =>
      aGet(app.appUrl('/newrelic'))
        .then(res => expect(res.text).to.equal('true'))
    );
  });

  describe('environment-aware setup', () => {
    it('should inject defaults for mandatory variables in dev mode', () => {
      const app = testkit.app('run-modes');

      return app.start()
        .then(() => aJsonGet(app.appUrl('/env')))
        .then(res => {
          expect(res.json).to.contain.deep.property('APP_CONF_DIR', './test/configs');
          expect(res.json).to.contain.deep.property('NEW_RELIC_ENABLED', 'false');
          expect(res.json).to.contain.deep.property('NEW_RELIC_NO_CONFIG_FILE', 'true');
          expect(res.json).to.contain.deep.property('NEW_RELIC_LOG', 'stdout');
        }).then(() => app.stop());
    });

    it('should validate mandatory environment variables in production', () => {
      const app = testkit.app('run-modes', {NODE_ENV: 'production'});

      return Promise.resolve()
        .then(() => expect(app.start()).to.be.rejected)
        .then(() => expect(app.stdouterr()).to.be.string('Mandatory env variable \'APP_CONF_DIR\' is missing'));
    });

  });

  describe('httpServer', () => {
    const app = testkit.app('express').beforeAndAfter();

    it('should patch main http server to emit "x-before-flushing-headers" event on http response', () =>
      fetch(app.appUrl('/patch')).then(res =>
        expect(res.headers.raw()).to.have.property('x-before-flushing-headers'))
    );
  });
  
  

  function aGet(url) {
    return fetch(url)
      .then(res => {
        expect(res.status).to.equal(200);
        return res.text().then(text => {
          return {res, text};
        });
      })
  }

  function aJsonGet(url) {
    return fetch(url)
      .then(res => {
        expect(res.status).to.equal(200);
        return res.json().then(json => {
          return {res, json};
        });
      })
  }
});