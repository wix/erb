'use strict';
const cluster = require('cluster'),
  express = require('express'),
  managementApp = require('../..');

if (cluster.isMaster) {

  managementApp({
    appPort: process.env.PORT,
    managementPort: process.env.MANAGEMENT_PORT,
    mountPoint: process.env.MOUNT_POINT
  }).start();

  cluster.fork();
} else {
  express()
    .get(process.env.MOUNT_POINT + '/health/is_alive', (req, res) => res.status(500).end())
    .listen(process.env.PORT);
}