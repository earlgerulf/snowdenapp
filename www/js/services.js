var bitcore = require('bitcore');
var Mnemonic = require('bitcore-mnemonic');

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
 
    return service;
});