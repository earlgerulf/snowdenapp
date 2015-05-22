angular.module('snowden.controllers', ['snowden.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $state ,wallet) {
  // Form data for the login modal
  $scope.loginData = {};

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    
    wallet.setMnemonic($scope.loginData.password);
    
    console.log($scope.loginData.password);

    $state.go('app.contacts');
  };
})


.controller('ContactlistsCtrl', function($scope) {
  
  $scope.contacts = [
    { address: '033d10793cb5406696d823e6d181c5b02dc332d9885b5bf1b1a1172e0919d31240',
      porn_name: 'Jocelyn Xero' },
    { address: '025cfdc6d176bb4b5448c2273db7d2444d7c35d6636c057b15448ef0a1a3e37964',
      porn_name: 'Gibson Zelda' }
  ];
})

.controller('ContactlistCtrl', function($scope, $http, $stateParams, ecies, wallet, messages) {
  
  var pubKey = wallet.toPublicKeyHashString($stateParams.contactId);
  
  console.log(pubKey);
  
  $scope.messages = messages.getMessages(pubKey);
  
  $scope.message = { text: "" };
  
  $scope.addMessage = function(message) {
    //we reset the text input field to an empty string
    $scope.message = { text: "" };
    
    var dest =  wallet.toPublicKey($stateParams.contactId);
    
    var msg = ecies.encrypt(message, dest, wallet.getPrivateKey());
    
    $http.get('https://test-insight.bitpay.com/api/addr/' + wallet.address
      + '/utxo')
    .then(function (response) {
      
      var txHex = wallet.createTXFromData(msg, response.data, dest);
      
      var dataObj = {
				rawtx : txHex
		  };	
		  
		  var res = $http.post('https://test-insight.bitpay.com/api/tx/send', dataObj);
  		res.success(function(data, status, headers, config) {
  			console.log(data.txid);
  		});
  		res.error(function(data, status, headers, config) {
  			console.log("Some error");
  		});
    });
    
  };
})

.controller('BalanceCtrl', function($scope, $http, wallet) {
  
  $scope.address = wallet.address;
  $scope.balance = 0;
  
  $http.get('https://test-insight.bitpay.com/api/addr/' + $scope.address)
  .then(function (response) {
      var data = response.data;
      $scope.balance = data.balanceSat;
  }); 
});
