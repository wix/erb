'use strict';
const express = require('express');

module.exports = config => {
  return express()
    .get('/', (req, res) => res.json(config.config));
};