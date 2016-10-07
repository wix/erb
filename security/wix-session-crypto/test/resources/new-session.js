'use strict';

const mismatchedPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3vS2nXhT51M1ldmT2orI
jbxYP36Mh0PAMuvRdVffZ1gKalKE6FZxKaILflKrUGXCq24HJDHWRxduF0nIk2JI
g3O9kD8pQGmdo9G7QLApFoXIWidhYjAcx5A9ASM9MLsECwBbUcXwhkFgDMCcjVRw
VJPtX/U5fkUEwGME9VSG8UJvYZTiwAqJIU1ko/UT7QT2ho7f172TCckDuqcFc6LO
WJ/ZC6XeUuQa1M5vqs/7uhsHLGuVd1B+RBc6lbozDV0eJOhqgzKZvjm13jRsyjZY
p1yTlwbJyJ39A5PMFYtRl8SasC6yIvSihHwGTCrgTYeOdDaVOSNp8J5fz6L/qiK0
8wIDAQAB
-----END PUBLIC KEY-----`;

module.exports = {
  validKey: require('../../lib/wix-new-session-crypto').devKey,
  validKeyInInvalidFormat: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApbgo7FKL3xjgA+Yq3RQgXKA8yWGsgKQI6xUDZ2tDekiMr5PypTGedJSUzkqc3dD472MLPZJoWPzxtVfJuzYDlXXTyyG7Gs+wW2rLJXSJHqKc6tPV4PNB3dIVxvztmOIZWa4v8cbYLQ7jO+vT7jBOM1iByVvrwI7gjmSJh58vWLCIy4cZOwfA4F12kQpl+s3/G4dgYjuhf6htjmXBW2M+x0mKBLeW4U7YFKsdYsEzTFHj8u0q4+uFKjNwCDzYl5yWW+ddo721cro5kbfH2HfVj0bmTFiP4sE2B0Bpcy7T92k7k2hlUSu339yl9NwWukqpRfKG9FoOmeZTEwz+L/zJCwIDAQAB',
  invalidKey: mismatchedPublicKey
};