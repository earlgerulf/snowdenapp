angular.module('snowden.controllers', ['snowden.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, wallet) {
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);
    
    wallet.setMnemonic($scope.loginData.password);

    $scope.closeLogin();
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
    
    var msg = ecies.encrypt(message, wallet.toPublicKey($stateParams.contactId), 
      wallet.getPrivateKey());
    
    $http.get('https://test-insight.bitpay.com/api/addr/' + wallet.address
      + '/utxo')
    .then(function (response) {
      
      var txHex = wallet.createTXFromData(msg, response.data);
      
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
