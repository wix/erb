const idGenerator = require('./requestid-generator'),
  serializer = require('./serializer'),
  fetch = require('node-fetch'),
  errors = require('./errors'),
  assert = require('assert'),
  EventEmittter = require('events').EventEmitter;

module.exports.client = (options, context) => new RpcClient(options, context);

class RpcClient extends EventEmittter {
  constructor(options, context) {
    super();
    this.beforeRequestHooks = options.beforeRequestHooks;
    this.afterResponseHooks = options.afterResponseHooks;
    this.timeout = options.timeout;
    this.url = options.url;
    this.context = context;
  }

  invoke() {
    const reqOptions = this._buildRequest(...arguments);
    this._emitBefore(arguments[0]);
    this._applyBeforeRequestHooks(reqOptions);
    
    return this._httpPost(reqOptions)
      .then(res => {
        this._applyAfterResponseHooks(res);
        return this._textOrErrorFromHttpRequest(reqOptions, res);
      }).then(resAndText => {
        const resAndJson = this._parseResponse(reqOptions, resAndText);
        const result = this._errorParser(reqOptions, resAndJson);
        this._emitSuccess();
        return result;
      }).catch(err => {
        this._emitFailure(err);
        return Promise.reject(err);
      });
  }
  
  _emitFailure(err) {
    this.emit('failure', err);
  }
  
  _emitSuccess() {
    this.emit('success');
  }
  
  _emitBefore(method) {
    this.emit('before', method);
  }
  
  _buildRequest() {
    const invocationOptions = this._resolveInvocationOptions(...arguments);
    const jsonRequest = RpcClient._serialize(invocationOptions.method, invocationOptions.args);
    return this._initialOptions(invocationOptions.timeout || this.timeout, jsonRequest);
  }

  _resolveInvocationOptions(...args) {
    assert(args.length > 0, 'At least 1 argument must be provided');
    if (typeof args[0] === 'object') {
      const options = args[0];
      assert(options, 'Options object can\'t be null');
      return options;
    } else {
      const method = args[0];
      const methodArgs = args.length > 1 ? args.slice(1) : [];
      return { method, args: methodArgs};
    }
  }

  _applyBeforeRequestHooks(reqOptions) {
    this.beforeRequestHooks.forEach(fn => fn(reqOptions.headers, reqOptions.body, this.context));
  }

  _httpPost(reqOptions) {
    return fetch(this.url, reqOptions)
      .catch(err => {
        return Promise.reject(new errors.RpcRequestError(this.url, reqOptions, null, err));
      });
  }

  _applyAfterResponseHooks(res) {
    this.afterResponseHooks.forEach(fn => fn(res.headers._headers, this.context));
  }

  _textOrErrorFromHttpRequest(reqOptions, res) {
    return res.text().then(text => {
      if (res.ok === true) {
        return { res, text };
      } else {
        return Promise.reject(new errors.RpcClientError(this.url, reqOptions, res, `Status: ${res.status}, Response: '${text}'`));
      }
    });
  }

  _parseResponse(reqOptions, resAndText) {
    try {
      return { res: resAndText.res, json: JSON.parse(resAndText.text) };
    } catch (e) {
      throw new errors.RpcClientError(this.url, reqOptions, resAndText.res, `expected json response, instead got '${resAndText.text}'`);
    }
  }

  _errorParser(reqOptions, resAndJson) {
    return resAndJson.json.error ? Promise.reject(new errors.RpcError(this.url, reqOptions, resAndJson.res, resAndJson.json.error)) : resAndJson.json.result;
  }

  static get _serialize() {
    return serializer.get(idGenerator);
  }

  _initialOptions(timeout, jsonRequest) {
    return {
      method: 'POST',
      body: jsonRequest,
      timeout: timeout,
      headers: {
        'Content-Type': 'application/json-rpc',
        'Accept': 'application/json-rpc'
      }
    };
  }
}
