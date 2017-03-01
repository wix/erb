const createExpressApp = require('./specs-express-app'),
  SpecsManager = require('wnp-petri-specs'),
  petriUrl = require('./load-configuration');

module.exports = class PetriSpecsComposer {

  expressApp() {
    return () => createExpressApp(this._thenableFn);
  }

  createManager({env, config, log, rpcFactory}) {
    if (!this._manager) {
      this._manager = new SpecsManager(rpcFactory, petriUrl({env, config, log}), log);
    }
    return this._manager;
  }

  get _thenableFn() {
    return () => this._manager.send()
  }
};
