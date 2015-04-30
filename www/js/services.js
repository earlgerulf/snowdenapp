var bitcore = require('bitcore');
var Mnemonic = require('bitcore-mnemonic');

angular.module('starter.services', [])

.service('wallet', function() {
     
    var service = {};
    
    var network = bitcore.Networks.testnet;
    
    service.mnemonic = new Mnemonic().toString();
    service.privateKey = new Mnemonic(service.mnemonic).toHDPrivateKey();
    service.address = new bitcore.Address(service.privateKey.publicKey, network).toString();
    
    service.setMnemonic = function(code) {
        service.mnemonic =  new Mnemonic(code).toString();
        service.privateKey = new Mnemonic(service.mnemonic).toHDPrivateKey();
        service.address = new bitcore.Address(service.privateKey.publicKey, network).toString();
        
        
        console.log(service.address);
    }
 
    return service;
})

.service('blockchain', function($http) {
     
    var service = {};
 
    service.getBalance = function(address) {
        
        $http.get('https://blockchain.info/q/getreceivedbyaddress/' + address + '?cors=true')
        .then(function (response) {
            var data = response.data;
            console.log(data);
            return data;
        }); 
    }
 
    return service;
});