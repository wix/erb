#!/usr/bin/env node
'use strict';
const log = require('../../lib/logger')(),
  shelljs = require('shelljs'),
  _ = require('lodash'),
  forCommand = require('../../lib/commands').forCommand,
  yargsOpts = require('../../lib/yargs-opts');

exports.command = 'deps';
exports.desc = 'perform operations on managed module dependencies';
exports.builder = yargs => {
  return yargs
    .usage('\nUsage: octo deps [options] <command>')
    .command('extraneous', 'show managed dependencies that are not used in modules', yargs => yargs, extraneousHander())
    .command('unmanaged', 'show unmanaged module dependencies', yargs => yargs, unmanagedHander())
    .command('latest', 'show latest versions for managed dependencies', yargs => yargs, latestHander())
    .command('sync', 'sync module versions with managed dependency versions (--save to persist changes)', yargs => yargs.option('s', yargsOpts.save), syncHander())
    .command('rm', 'remove provided dependency from all modules (deps, devDeps, peerDeps) (--save to persist changes)', yargs => yargs.option('s', yargsOpts.save).demand(1), rmHander())
    .demand(1);
};

function latestHander() {
  return forCommand('octo deps latest', (octo, config) => {
    const modules = octo.modules;
    if (modules.length === 0) {
      log.warn('no modules found');
    } else {
      latest(Object.assign({}, config.dependencies, config.devDependencies), 'dependencies, devDependencies');
      latest(Object.assign({}, config.peerDependencies), 'peerDependencies');
    }
  });
}

function rmHander() {
  return forCommand(opts => `octo deps rm ${opts._.slice(2).join()}`, (octo, config, opts) => {
    const save = opts.save;
    const toRemove = opts._.slice(2).join();
    const removes = [`dependencies.${toRemove}`, `devDependencies.${toRemove}`, `peerDependencies.${toRemove}`];

    const modules = octo.modules;
    const count = modules.length;

    if (count === 0) {
      log.warn('no modules found');
    } else {
      let notFound = true;
      modules.forEach((module, i) => {
        const removed = module.rm(removes, save);
        if (removed.length > 0) {
          log.for(`${module.npm.name} (${module.relativePath}) (${i + 1}/${count})`, () => {
            removed.forEach(path => {
              log.info(`${path.split('.')[1]} (${path.split('.')[0]})`);
              notFound = false;
            });
          });
        }
      });

      if (notFound === true) {
        log.warn('Nothing found to remove');
      }
    }
  });
}


function syncHander() {
  return forCommand('octo deps sync', (octo, config, opts) => {
    const save = opts.save;
    const modules = octo.modules;
    const depsAndVersions = getModulesAndVersions(modules);
    const count = modules.length;

    if (count === 0) {
      log.warn('no modules found');
    } else {
      let notFound = true;
      modules.forEach((module, i) => {
        const diff = module.merge({
          dependencies: config.dependencies || {},
          devDependencies: config.dependencies || {},
          peerDependencies: config.peerDependencies || {}
        }, save);
        if (diff) {
          log.for(`${module.npm.name} (${module.relativePath}) (${i + 1}/${count})`, () => {
            Object.keys(diff).forEach(type => {
              const changedDeps = diff[type];
              Object.keys(changedDeps).forEach(dep => {
                if (!depsAndVersions[dep]) {
                  log.info(`${dep} (${type}) (${changedDeps[dep][0]} -> ${changedDeps[dep][1]})`);
                  notFound = false;
                }
              });
            });
          });
        }
      });

      if (notFound === true) {
        log.warn('No un-synced dependencies found');
      }
    }
  });
}

function extraneousHander() {
  return forCommand('octo deps extraneous', (octo, config) => {
    const modules = octo.modules;
    if (modules.length === 0) {
      log.warn('no modules found');
    } else {
      const platformDeps = getModulesAndVersions(modules);
      extraneous(modules, Object.assign({}, config.dependencies, config.devDependencies), platformDeps, ['dependencies', 'devDependencies']);
      extraneous(modules, Object.assign({}, config.peerDependencies), platformDeps, ['peerDependencies']);
    }
  });
}

function unmanagedHander() {
  return forCommand('octo deps unmanaged', (octo, config) => {
    const modules = octo.modules;
    if (modules.length === 0) {
      log.warn('no modules found');
    } else {
      const platformDeps = getModulesAndVersions(modules);
      unmanaged(modules, Object.assign({}, config.dependencies, config.devDependencies), platformDeps, ['dependencies', 'devDependencies']);
      unmanaged(modules, Object.assign({}, config.peerDependencies), platformDeps, ['peerDependencies']);
    }
  });
}

function latest(deps, type) {
  log.for(`Latest ${type}:`, () => {
    let hadUpdates = false;
    Object.keys(deps).forEach((depName) => {
      const currentVersion = deps[depName];
      const latestVersion = shelljs.exec(`npm show ${depName} version`, {silent: true}).stdout.replace('\n', '');
      if (currentVersion.indexOf(latestVersion) > -1) {
        log.info(`${depName} (${currentVersion} -> ${latestVersion})`);
      } else {
        hadUpdates = true;
        log.warn(`${depName} (${currentVersion} -> ${latestVersion})`);
      }
    });

    if (hadUpdates === false) {
      log.warn(`No updates for ${type} found`);
    }
  });
}

function extraneous(modules, deps, platformModules, depTypes) {
  const dependencies = _.cloneDeep(deps);
  const modulesDeps = {};
  modules.forEach(module => Object.assign.apply(null, [modulesDeps].concat(depTypes.map(type => module.packageJson[type]))));
  Object.keys(platformModules).forEach(name => delete modulesDeps[name]);
  Object.keys(modulesDeps).forEach(name => delete dependencies[name]);

  if (_.isEqual({}, dependencies)) {
    log.warn(`No extraneous ${depTypes.join(', ')} found`);
  } else {
    log.for(`Extraneous ${depTypes.join(', ')}: `, () => {
      Object.keys(dependencies).forEach(el => log.info(el));
    });
  }
}
//
function unmanaged(modules, deps, platformModules, depTypes) {
  const modulesDeps = {};
  modules.forEach(module => {
    depTypes.forEach(depType => {
      const moduleDeps = module.packageJson[depType] || {};
      Object.keys(moduleDeps).forEach(dep => {
        if (modulesDeps[dep]) {
          modulesDeps[dep].push(moduleDeps[dep]);
        } else {
          modulesDeps[dep] = [moduleDeps[dep]];
        }
      });
    });
  });
  Object.keys(platformModules).forEach(name => delete modulesDeps[name]);
  Object.keys(deps).forEach(name => delete modulesDeps[name]);

  if (_.isEqual({}, modulesDeps)) {
    log.warn(`No unmanaged ${depTypes.join(', ')} found`.green);
  } else {
    log.for(`Unmanaged ${depTypes.join(', ')}: `, () => {
      Object.keys(modulesDeps).forEach(el => log.info(`${el} (${modulesDeps[el].join(', ')})`));
    });
  }
}

function getModulesAndVersions(modules) {
  return modules.reduce((prev, curr) => {
    prev[curr.npm.name] = `~${curr.npm.version}`;
    return prev;
  }, {});
}
