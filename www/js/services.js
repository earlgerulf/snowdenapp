var bitcore = require('bitcore');
var Mnemonic = require('bitcore-mnemonic');
var ECIES = require('bitcore-ecies');
var Buffer = bitcore.deps.Buffer;

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
    
    service.createDataAddress = function(hex) {
      
      var data = new Buffer(hex, 'hex');
      return new bitcore.Address(data, network, bitcore.Address.PayToPublicKeyHash).toString();
    }
    
    service.getDataFromAddress = function(address) {
      
      var addr = new bitcore.Address(address, network, bitcore.Address.PayToPublicKeyHash);
      
      console.log(addr.toJSON());
    }
    
    service.createTXFromData = function(dataString, utxos) {
      var data = new Buffer(dataString, 'hex');
      
      var buffs = [];
      
      // Split the data into 20 byte length buffers.
      var zeros = new Buffer(20);
      for(var i = 0; i < data.length; i+= 20) {
        
        var slice = data.slice(i, i + 20);
        
        if(slice.length < 20) {
          slice = Buffer.concat([slice, zeros.slice(0, 20 - slice.length)]);
        }
        
        buffs.push(slice);
      }
      
      var tx = new bitcore.Transaction();
      
      for(var i = 0; i < utxos.length; i++) {
        
        tx.from({'txid': utxos[i].transaction_hash, 
          vout: utxos[i].output_index, 
          satoshis: utxos[i].value, 
          scriptPubKey: utxos[i].script_hex});
          
      }
      
      for(var i = 0; i < buffs.length; i++) {
         tx.to(service.createDataAddress(buffs[i]), 1000);
      }
      console.log(tx.toBuffer().toString('hex'));
      return tx;
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