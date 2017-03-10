const cluster = require('cluster'),
  engine = require('./engine'),
  log = require('wnp-debug')('wix-cluster'),
  ForkMeter = require('./engine/fork-meter'),
  DeathRow = require('./engine/death-row'),
  eventLoop = require('./meter/event-loop').loop,
  memoryUsage = require('./meter/memory-usage').usage,
  connectStatsD = require('./meter/connect-statsd'),
  StatsD = require('node-statsd'),
  StatsDAdapter = require('wix-measured-statsd-adapter'),
  WixMeasured = require('wix-measured'),
  sendToWorker = require('./send-to-worker');

module.exports = opts => {
  const metricsConf = opts && opts.metrics || {};
  let fallbackFunction = opts && opts.fallback || fallback;

  const send = sendToWorker(log);
  const metrics = new WixMeasured(metricsConf.app_host, metricsConf.app_name);
  connectStatsD(StatsD, StatsDAdapter, log)(metrics, opts.statsd);
  
  const masterMetrics = metrics.collection('tag', 'INFRA').collection('class', 'master-process');
  const workerMetrics = metrics.collection('tag', 'INFRA').collection('class', 'worker-process');
  const context = {cluster, deathRow: new DeathRow(), forkMeter: new ForkMeter(), currentProcess: process};

  [
    require('./plugins/logger').master(log),
    require('./plugins/master-stats').master(masterMetrics, eventLoop, memoryUsage, process),
    require('./plugins/worker-stats').master(workerMetrics),
    require('./plugins/worker-notifier').master(send),
    require('./plugins/message-broadcaster').master(send)
  ].map(plugin => plugin(context));

  return engine.master(fallbackFunction, log)(context);
};

function fallback(err) {
  log.error('Cluster failed with: ', err);
}
