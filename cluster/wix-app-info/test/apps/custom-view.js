'use strict';
const express = require('express'),
  appInfo = require('../..');

class CustomView extends appInfo.views.AppInfoView {
  get data() {
    return Promise.resolve({items: [appInfo.views.item('anItemName', 'anItemValue')]});
  }
}

function customView(appDir) {
  return new CustomView({
    appDir: appDir,
    mountPath: '/custom',
    title: 'Custom',
    template: 'single-column'
  });
}

express().use(process.env.MOUNT_POINT, appInfo({views: [customView]})).listen(process.env.PORT, () => {
  console.log('app started on port: ' + process.env.PORT + ' mount: ' + process.env.MOUNT_POINT);
});