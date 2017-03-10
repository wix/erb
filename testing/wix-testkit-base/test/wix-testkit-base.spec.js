const TestkitStub = require('./stubs'),
  chai = require('chai'),
  expect = chai.expect;

chai.use(require('chai-as-promised'));

describe('wix-testkit-base', () => {

  describe('start', () => {

    it('should successfully start a service using promise return', () =>
      new TestkitStub().start()
    );

    it('should successfully start a service using callback', done =>
      new TestkitStub().start(res => {
        expect(res).to.be.undefined;
        done();
      })
    );

    it('should return rejected promise if service failed to start', () =>
      expect(new TestkitStub(true, true).start()).to.be.rejectedWith(Error, 'start failed')
    );

    it('should call callback with error on start failure', done =>
      new TestkitStub(true, true).start(err => {
        expect(err).to.be.instanceof(Error);
        expect(err.message).to.equal('start failed');
        done();
      })
    );
  });

  describe('stop', () => {

    it('should successfully stop a service using promise return', () => {
      const service = new TestkitStub();
      return service.start().then(() => service.stop());
    });

    it('should successfully stop a service using callback', done => {
      const service = new TestkitStub();
      service.start().then(() => service.stop(res => {
        expect(res).to.be.undefined;
        done();
      }));
    });

    it('should return rejected promise if service failed to stop', () => {
      const service = new TestkitStub(false, true);
      return expect(service.start().then(() => service.stop())).to.be.rejectedWith(Error, 'stop failed');
    });

    it('should call callback with error on stop failure', done => {
      const service = new TestkitStub(false, true);
      service.start().then(() => service.stop(err => {
        expect(err).to.be.instanceof(Error);
        expect(err.message).to.equal('stop failed');
        done();
      }));
    });
  });

  describe('beforeAndAfter', () => {
    const service = new TestkitStub();

    before(() => expect(service.running).to.be.false);

    service.beforeAndAfter();

    it('should be started', () => expect(service.running).to.be.true);

    after(() => expect(service.running).to.be.false);
  });

  describe('beforeAndAfterEach', () => {
    const service = new TestkitStub();

    before(() => expect(service.running).to.be.false);

    service.beforeAndAfterEach();

    it('should be started', () => expect(service.running).to.be.true);
    it('should be started', () => expect(service.running).to.be.true);

    after(() => {
      expect(service.running).to.be.false;
      expect(service.cycleCount).to.equal(2);
    });
  });

  it('should fail on multiple start invocations via promises', () => {
    const service = new TestkitStub();
    return expect(service.start()
      .then(() => service.start())).to.be.rejectedWith(Error, 'service was already started');
  });

  it('should fail on multiple start invocations via callbacks', done => {
    const service = new TestkitStub();
    service.start(err => {
      expect(err).to.be.undefined;
      service.start(err => {
        expect(err.message).to.be.string('service was already started');
        done();
      });
    });
  });

  it('should fail on multiple stop invocations using promises', () => {
    const service = new TestkitStub();
    return expect(service.start()
      .then(() => service.stop())
      .then(() => service.stop())).to.be.rejectedWith(Error, 'service is not running');
  });

  it('should fail on multiple stop invocations val callbacks', done => {
    const service = new TestkitStub();
    service.start(() => {
      service.stop(err => {
        expect(err).to.be.undefined;
        service.stop(err => {
          expect(err.message).to.be.string('service is not running');
          done();
        });
      });
    });
  });


  it('should fail for stopping a not-started service using promises', () => {
    const service = new TestkitStub(false, true);
    return expect(service.stop()).to.be.rejectedWith(Error, 'service is not running');
  });

  it('should fail for stopping a not-started service using callbacks', done => {
    const service = new TestkitStub(false, true);
    service.stop(err => {
      expect(err.message).to.equal('service is not running');
      done();
    });
  });


  it('should allow to start a stopped service', () => {
    const service = new TestkitStub();
    return service.start()
      .then(() => service.stop())
      .then(() => service.start());
  });


  describe('beforeAndAfter return', () => {

    const service = new TestkitStub().beforeAndAfter();

    it('should be self', () => {
      expect(service).to.be.instanceOf(TestkitStub);
    });
  });

  describe('beforeAndAfterEach return', () => {

    const service = new TestkitStub().beforeAndAfterEach();

    it('should be self', () => {
      expect(service).to.be.instanceOf(TestkitStub);
    });
  });


});
