# wix-config-emitter

Given config .erb templates and function/value declarations to apply, renders resulting configs.

Imitates what chef does in wix production.

## install

```js
npm install --save wix-config-emitter
```

## usage

Given you have config template (`my-app.json.erb`) in './templates':

```json
{
  "production": "<%= node[:node_environment] == 'production' ? true : false %>",
  "someRpcServer": "<%= service_url('com.wixpress.some-rpc-server') %>",
  "someStaticServer": "<%= static_url('com.wixpress.some-statics-server', {schemaless: true}) %>",
  "baseUri": "http://www.<%= base_domain%>/create/website"
}
```

and executing code:

```js
const emitter = require('wix-config-emitter');

emitter()
  .val('node', { 'node_environment': false })
  .fn('service_url', 'com.wixpress.some-rpc-server', 'http://localhost:8080')
  .fn('static_url', 'com.wixpress.mobile.some-statics-server', {schemaless: true},  'http://localhost:8081')
  .val('base_domain', 'boo')  
  .emit();
```

Will render resulting config in `./test/configs`:

```json
{
  "production": "false",
  "someRpcServer": "http://localhost:8080",
  "someStaticsServer": "http://localhost:8081",
  "baseUri": "http://www.boo/create/website"
}
```

For functions/values to be used please see [Wix Artifact Config Templates](https://kb.wixpress.com/pages/viewpage.action?title=Wix+Artifact+Config+Templates&spaceKey=chef).

## post processing callback

It's possible to provide a function that would manipulate the configuration file contents right before it's saved to the file system.
One use case for that is the configuration values, that don't have helper functions, for example redis host.

Given you have config template (`my-app.json.erb`) in './templates':

```json
{
  "production": "<%= node[:node_environment] == 'production' ? true : false %>",
  "redisHost": "http://machine1.redis.aws.com"
}
```

and executing code:

```js
const emitter = require('wix-config-emitter');
function replaceRedisHost(data, configEntry) {
  let contents = JSON.parse(data);
  if (configEntry.src.indexOf('my-app.json.erb') !== -1) {
    contents.redisHost = 'http://localhost';
  }

  return JSON.stringify(contents);
}

emitter()
  .val('node', { 'node_environment': false })  
  .emit(replaceRedisHost);
```

Will render resulting config in `./test/configs`:

```json
{
  "production": "false",
  "redisHost": "http://localhost"
}
```

## Api

### (opts): WixConfigEmitter
Create new instance of `WixConfigEmitter` with provided options.

Parameters:
 - opts - object, optional;
  - sourceFolders - array of string, mandatory - list of folders to load '*.erb' templates from;
  - targetFolder - string, mandatory - folder to write rendered configs to. Will create folder if it does not exist.

Given `opts` is not provided, it infers defaults:

```js
{
  sourceFolders: ['./templates'],
  targetFolder: './test/configs'
}
```

### WixConfigEmitter.fn(fnName, fnArgs..., value): WixConfigEmitter
Declare an '.erb' function with arguments and resulting value to be applied against config template.

Parameters:
 - fnName - string, mandatory - name of function to apply, ex. 'databag_passwd', 'service_url';
 - fnArgs - varargs of string, mandatory - function arguments to match for application;
 - value - primitive, mandatory - value to replace function to.
 
Note that there can be multiple function applications with different arguments:
 
```js
require('wix-config-emitter')()
  .fn('service_url', 'artifact1', 'value1')
  .fn('service_url', 'artifact2', 'value2')
  .emit();
```

### WixConfigEmitter.val(varName, value): WixConfigEmitter
Declare an '.erb' variable and resulting value to be applied against config template.

Parameters:
 - varName - string, mandatory - name of variable to substitute;
 - value - primitive, mandatory - value to replace function to.

Note that there can be only one variable declaration and last one declared takes precedence:
 
```js
require('wix-config-emitter')()
  .val('base_domain', 'localhost')
  .emit();
```

### WixConfigEmitter.emit(postProcessingFn): Promise
Render configs and return a Promise.

Callback post processing function may be provided to do any additional modifications of the config file before writing it to the file system.
`postProcessingFn` function will receive 2 parameters: 
 - data - string, contents of the configuration file and
 - configEntry - object, containing the info of the configuration file, ex: 
```json
{ 
  "src": "test/test-configs/multi/second.txt.erb",
  "dest": "test/configs/multi/second.txt" 
}
    
```
    