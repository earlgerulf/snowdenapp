var bitcore = require('bitcore');
var Mnemonic = require('bitcore-mnemonic');

angular.module('starter.services', [])

.service('wallet', function() {
     
    var service = {};
    var mnemonic = new Mnemonic();
    var privateKey = mnemonic.toHDPrivateKey();
    var network = bitcore.Networks.testnet;
 
    service.getAddress = function() {
        
        var hd = new bitcore.HDPrivateKey(privateKey);
        var der = hd.derive("m/0'");
        
        var address = new bitcore.Address(privateKey.publicKey, network);
        
        return address.toString();
    }
 
    service.getMnemonic = function() {
        return mnemonic.toString();
    }
    
    service.setMnemonic = function(code) {
        
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