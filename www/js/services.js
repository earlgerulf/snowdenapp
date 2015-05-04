var bitcore = require('bitcore');
var Mnemonic = require('bitcore-mnemonic');
var ECIES = require('bitcore-ecies');

angular.module('starter.services', [])

.service('wallet', function(storage) {
     
    var service = {};
    
    var network = bitcore.Networks.testnet;
    
    if(storage.get('mnemonic') == null) {
      service.mnemonic = new Mnemonic().toString();
      storage.set('mnemonic', service.mnemonic);
    } else {
      service.mnemonic = storage.get('mnemonic');
    }
    
    service.privateKey = new Mnemonic(service.mnemonic).toHDPrivateKey();
    service.address = new bitcore.Address(service.privateKey.publicKey, network).toString();
    
    service.setMnemonic = function(code) {
        service.mnemonic =  new Mnemonic(code).toString();
        service.privateKey = new Mnemonic(service.mnemonic).toHDPrivateKey();
        service.address = new bitcore.Address(service.privateKey.publicKey, network).toString();
        
        storage.set('mnemonic', service.mnemonic);
    }
    
    service.getPublicKey = function() {
      return service.privateKey.publicKey;
    }
    
    service.getPrivateKey = function() {
      return service.privateKey.privateKey;
    }
 
    return service;
})

.service('ecies', function(storage) {
     
    var service = {};
    
    service.encrypt = function(text, publicKey, privateKey) {
      // Encrypt data
      var cypher = ECIES().privateKey(privateKey).publicKey(publicKey);
      return cypher.encrypt(text).toString('hex');
    }
 
    return service;
});