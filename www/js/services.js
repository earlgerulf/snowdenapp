var bitcore = require('bitcore');

angular.module('starter.services', [])

.factory('wallet', function() {
     
    var factory = {};
    var privateKey = new bitcore.PrivateKey();
 
    factory.getAddress = function() {
        return privateKey.toString();
    }
 
    return factory;
});