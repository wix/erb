const HttpStatus = require('http-status-codes'),
  assert = require('assert');

const ErrorCode = {
  UNKNOWN: -100,
  INVALID_SESSION: -101,
  RPC_ERROR: -102,
  GATEKEEPER_ACCESS_DENIED: -103,
  HEALTH_TEST_FAILED: -104,
  SESSION_REQUIRED: -105,
  BAD_CSRF_TOKEN: -106
};

function makeErrorClass(additionalProperties) {

  return (errorCode = ErrorCode.UNKNOWN, httpStatus = HttpStatus.INTERNAL_SERVER_ERROR) => {

    assert(Number.isInteger(errorCode), 'errorCode must be provided and be a valid integer');
    assert.doesNotThrow(() => HttpStatus.getStatusText(httpStatus), 'HTTP status must be valid');

    return class extends Error {

      constructor(msg, cause) {
        super(msg);
        assert(!msg || typeof(msg) === 'string', 'message is mandatory');
        assert(!cause || cause instanceof Error, 'cause has to be an instance of Error');
        this._cause = cause;
        this.name = this.constructor.name;
        Object.assign(this, additionalProperties);
        generateStackTrace(this, cause);
      }

      get cause() {
        return this._cause;
      }

      get errorCode() {
        return errorCode;
      }

      get httpStatusCode() {
        return httpStatus;
      }
    };
  };
}

function generateStackTrace(current, cause) {
  Error.captureStackTrace(current, current.constructor);
  if (cause) {
    current.stack = current.stack + '\nCaused By: ' + cause.stack;
  }
}

const wixBusinessError = makeErrorClass({'_exposeMessage': true});

const wixSystemError = makeErrorClass({});

class WixError extends wixSystemError(-100, HttpStatus.INTERNAL_SERVER_ERROR) {

  constructor(msg, cause) {
    super(msg, cause);
  }
}

module.exports = {WixError, wixBusinessError, wixSystemError, HttpStatus, ErrorCode};
