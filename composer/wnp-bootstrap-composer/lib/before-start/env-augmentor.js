const defaults = {
  PORT: 3000,
  MANAGEMENT_PORT: 3004,
  MOUNT_POINT: '',
  APP_CONF_DIR: './test/configs',
  APP_TEMPL_DIR: './templates',
  APP_LOG_DIR: './target/logs',
  APP_PERSISTENT_DIR: './target/persistent',
  HOSTNAME: 'localhost'
};

module.exports = (runMode, env, log) => {
  const injected = {};
  if (!runMode.isProduction()) {
    Object.keys(defaults).forEach(key => {
      if (!env[key]) {
        injected[key] = defaults[key];
        env[key] = defaults[key];
      }
    });

    if (Object.keys(injected).length > 0) {
      log.debug(`DEV mode detected and required env variables are missing, pre-loading stub values: ${JSON.stringify(injected)}`);
    }
  }
};
