# json-rpc-client

## Install
```
    npm install json-rpc-client --save
```

## Usage

```javascript
    // Load module
    var rpcFactory = require('json-rpc-client');
    
    // You can client object per Url
    var someClient = rpcFactory.rpcClient('http://some-url/SomeInterface', { /* settings  - tbd */});
    
    //Invoke one of the functions (methodName, varArgs of parameters)        
    var response = someClient('foo', 'bar', 'baz');        
```

