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
      
      return addr;
    }
    
    service.createTXFromData = function(dataString, utxos) {
      var data = new Buffer(dataString, 'hex');
      
      var buffs = [];
      
      // Split the data into 20 byte length buffers.
      var zeros = new Buffer(20);
      var padding = 0;
      for(var i = 0; i < data.length; i+= 20) {
        
        var slice = data.slice(i, i + 20);
        
        if(slice.length < 20) {
          padding = 20  - slice.length;
          slice = Buffer.concat([slice, zeros.slice(0, padding)]);
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
        
        // We need to encode the padding into the fee
        if(i == buffs.length - 1)
          tx.to(service.createDataAddress(buffs[i]), 1000 + padding);
        else
          tx.to(service.createDataAddress(buffs[i]), 1000);
      }
      
      tx.change(service.getPublicKey());
      
      tx.sign(service.getPrivateKey());
      
      return tx.toBuffer().toString('hex');
    } 
    
    service.getDataFromInsightTX = function(txObj) {
      
        
      var data = new Buffer(0);
        
      for(var i = 0; i < txObj.vout.length; i++) {
        
        var txOut = txObj.vout[i];
        
        var addr = Object.keys(txOut)[0];
        var satoshis = parseInt(txOut[addr]);
        var padding = 0
        // Is this a data output.
        if(satoshis == 1000) {
          data = Buffer.concat([data, service.getDataFromAddress(addr).hashBuffer]);
        } 
        
        if(satoshis > 1000 && satoshis < 1021) {
          var padding = satoshis - 1000;
          var hash = service.getDataFromAddress(addr).hashBuffer;
          var hashWithoutPAdding = hash.slice(0, 20 - padding);
          data = Buffer.concat([data, hashWithoutPAdding]);
        }
      }
          
      return data.toString('hex');
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
    
    service.decrypt = function(text, publicKey, privateKey) {
      // Encrypt data
      var cypher = ECIES().privateKey(privateKey).publicKey(publicKey);
      return cypher.decrypt(new Buffer(text, 'hex')).toString();
    }
 
    return service;
});