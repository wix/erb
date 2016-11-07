const origin = 'wix-cluster';

module.exports.isWixClusterMessageWithKey = (msg, key) => isWixClusterMessage(msg, key);
module.exports.aWixClusterMessageWithKey = (key, data) => aWixClusterMessage(key, data);

module.exports.isWorkerMemoryStatsMessage = msg => isWixClusterMessage(msg, 'worker-stats-memory');
module.exports.workerMemoryStatsMessage = data => aWixClusterMessage('worker-stats-memory', data);

module.exports.isWorkerEventLoopMessage = msg => isWixClusterMessage(msg, 'worker-stats-event-loop');
module.exports.workerEventLoopMessage = data => aWixClusterMessage('worker-stats-event-loop', data);

module.exports.isStatsdActivationMessage = msg => isWixClusterMessage(msg, 'statsd');
module.exports.statsdActivationMessage = data => aWixClusterMessage('statsd', data);

function aWixClusterMessage(key, value) {
  return {origin, key, value};
}

function isWixClusterMessage(msg, key) {
  return !!(msg && msg.origin && msg.origin === origin && msg.key && msg.key === key);
}