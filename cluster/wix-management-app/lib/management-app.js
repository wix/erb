'use strict';
const express = require('express'),
  join = require('path').join,
  Stats = require('./plugins/cluster-stats'),
  request = require('request');

module.exports.builder = () => new ManagementAppBuilder();

function ManagementApp(mountPoint, port, routers) {
  const appPort = process.env.PORT || 8080;
  const app = express();

  routers.forEach(router => {
    app.use(mountPoint, router);
  });

  app.get(mountPoint, (req, res) => {
    res.send({
      appName: process.env.APP_NAME || 'env key APP_NAME not defined',
      mountPoint: process.env.MOUNT_POINT || 'env key MOUNT_POINT not defined',
      port: process.env.PORT || 'env key PORT not defined',
      managementPort: process.env.MANAGEMENT_PORT || 'env key MANAGEMENT_PORT not defined',
      uptimeSec: process.uptime(),
      timeSec: new Date().getTime(),
      version: process.version,
      pid: process.pid
    });
  });

  app.get(join(mountPoint, '/health/deployment/test'), (req, res) => {
    request('http://localhost:' + appPort + join(mountPoint, '/health/is_alive'), error => {
      if (error) {
        res.status(500).end();
      }
      else {
        res.end();
      }
    });
  });

  this.start = done => {
    return app.listen(port, () => {
      console.log('Management app listening on path: %s port: %s', mountPoint, port);
      if (done) {
        done();
      }
    });
  };
}

function ManagementAppBuilder() {
  const mountPoint = process.env.MOUNT_POINT || '/';
  const port = process.env.MANAGEMENT_PORT || '8084';
  const pages = [new Stats()];

  this.addPage = page => {
    pages.push(page);
    return this;
  };

  this.build = () => new ManagementApp(mountPoint, port, pages);
}