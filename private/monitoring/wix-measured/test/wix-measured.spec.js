const expect = require('chai').expect,
  WixMeasured = require('..'),
  sinon = require('sinon');

describe('wix-measured', () => {

  it('should validate mandatory arguments', () => {
    expect(() => new WixMeasured()).to.throw('host');
    expect(() => new WixMeasured('')).to.throw('host');
    expect(() => new WixMeasured({})).to.throw('host');
    expect(() => new WixMeasured('local')).to.throw('appName');
    expect(() => new WixMeasured('local', {})).to.throw('appName');
    expect(() => new WixMeasured('local', 'app')).to.not.throw(Error);
  });

  it('should create instance with common prefix', () => {
    const collector = aReporter();
    const metrics = aMetrics(collector, 'nonlocal', 'nonapp');

    assertPrefixForMetrics('root=node_app_info.host=nonlocal.app_name=nonapp', metrics, collector);
  });

  describe('meter', () => {

    it('should create a new meter', () => {
      const collector = aReporter();
      const metrics = aMetrics(collector);

      metrics.meter('rpm');
      assertMeterCountValue(collector, 'rpm', 1);
    });

    it('should reuse same meter from registry for subsequent invocations', () => {
      const collector = aReporter();
      const metrics = aMetrics(collector);

      metrics.meter('rpm');
      metrics.meter('rpm', 2);

      assertMeterCountValue(collector, 'rpm', 3);
    });

    it('should configure meter to report minute rate', sinon.test(function () {
      const collector = aReporter();
      const metrics = aMetrics(collector);

      for (let i = 0; i < 60; i++) {
        metrics.meter('rpm', 10);
        this.clock.tick(10000);
      }

      assertMeterRateValue(collector, 'rpm', {from: 55, to: 65});
    }));
  });

  describe('gauge', () => {

    it('should create a new gauge with function', () => {
      const collector = aReporter();
      const metrics = aMetrics(collector);

      metrics.gauge('reqPerSecond', () => 1);
      assertGaugeValue(collector, 'reqPerSecond', 1);
    });

    it('should create a new gauge with value', () => {
      const collector = aReporter();
      const metrics = aMetrics(collector);

      metrics.gauge('reqPerSecond', 1);
      assertGaugeValue(collector, 'reqPerSecond', 1);
    });

    it('should allow to override gauge', () => {
      const collector = aReporter();
      const metrics = aMetrics(collector);

      metrics.gauge('reqPerSecond', () => 1);
      assertGaugeValue(collector, 'reqPerSecond', 1);

      metrics.gauge('reqPerSecond', 3);
      assertGaugeValue(collector, 'reqPerSecond', 3);
    });
  });

  describe('histogram', () => {
    it('should create a new histogram', () => {
      const collector = aReporter();
      const metrics = aMetrics(collector);

      metrics.hist('reqPerSecond', 1);
      assertHistInvocations(collector, 'reqPerSecond', 1);
    });

    it('should reuse same meter from registry for subsequent invocations', () => {
      const collector = aReporter();
      const metrics = aMetrics(collector);

      metrics.hist('reqPerSecond', 1);
      metrics.hist('reqPerSecond', 12);
      assertHistInvocations(collector, 'reqPerSecond', 2);
    });
  });

  describe('collection', () => {

    it('should validate presence of at least 1 tag', () => {
      expect(() => aWixMeasured().collection()).to.throw('mandatory');
      expect(() => aWixMeasured().collection({})).to.throw('be a string');
    });

    it('should return a new measured instance with same key if prefix is not provided', () => {
      const reporter = aReporter();
      const collection = aWixMeasured().addReporter(reporter).collection('childKey=childValue');

      assertPrefixForMetrics('childKey=childValue', collection, reporter);
    });

    it('should return a new measured instance with suffix added to parent prefix', () => {
      const reporter = aReporter();
      const collection = aWixMeasured().addReporter(reporter)
        .collection('parentKey=parentValue')
        .collection('childKey=childValue');

      assertPrefixForMetrics('parentKey=parentValue.childKey=childValue', collection, reporter);
    });
  });
});

function assertPrefixForMetrics(prefix, metrics, collector) {
  metrics.meter('reqPerSecond');
  expect(collector.meters((prefix === '' ? '' : prefix + '.') + 'meter=reqPerSecond')).to.not.be.undefined;
}

function assertMeterCountValue(reporter, name, expectedValue) {
  expect(reporter.meters('meter=' + name).toJSON().count).to.equal(expectedValue);
}

function assertMeterRateValue(reporter, name, expectedRange) {
  expect(reporter.meters('meter=' + name).toJSON()['1MinuteRate']).to.be.within(expectedRange.from, expectedRange.to);
}

function assertGaugeValue(reporter, name, expectedValue) {
  expect(reporter.gauges('gauge=' + name).toJSON()).to.equal(expectedValue);
}

function assertHistInvocations(reporter, name, count) {
  expect(reporter.hists('hist=' + name).toJSON().count).to.equal(count);
}

function aMetrics(reporter, host, app) {
  return aWixMeasured(host, app).addReporter(reporter);
}
function aReporter() {
  return new FilteringReporter();
}


class FilteringReporter {
  addTo(measured) {
    this._measured = measured;
  }

  meters(key) {
    return this._findKeyIn(this._measured.meters, key);
  }

  gauges(key) {
    return this._findKeyIn(this._measured.gauges, key);
  }

  hists(key) {
    return this._findKeyIn(this._measured.hists, key);
  }

  _findKeyIn(where, keyPart) {
    const matchedKey = Object.keys(where).find(el => el.indexOf(keyPart) > -1);
    if (matchedKey) {
      return where[matchedKey];
    }
  }
}

function aWixMeasured(host = 'local', app = 'app') {
  return new WixMeasured(host, app);
}