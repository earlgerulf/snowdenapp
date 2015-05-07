angular.module('starter.controllers', ['starter.services'])

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
    { address: '033d10793cb5406696d823e6d181c5b02dc332d9885b5bf1b1a1172e0919d31240' },
    { address: '025cfdc6d176bb4b5448c2273db7d2444d7c35d6636c057b15448ef0a1a3e37964' }
  ];
})

.controller('ContactlistCtrl', function($scope, $http, $stateParams, ecies, wallet) {
  
  $scope.messages = [
    { text: 'Hello' },
    { text: 'Hi' }
  ];
  
  // Listen to all TX's
  /*var socket = io("https://test-insight.bitpay.com");
  socket.on('connect', function() {
    // Join the room.
    socket.emit('subscribe', 'inv');
  })
  socket.on('tx', function(data) {
    console.log("New transaction received: " + data.txid);
    $scope.messages.push({text: data.txid});
    $scope.$apply();
  })*/
  
  $scope.message = { text: "" };
  
  $scope.addMessage = function(message) {
    //we reset the text input field to an empty string
    $scope.message = { text: "" };
    
    var msg = ecies.encrypt(message, wallet.getPublicKey(), wallet.getPrivateKey());
    
    $scope.messages.push({text: msg});
    
    $http.get('https://api.chain.com/v2/testnet3/addresses/' + wallet.address
      + '/unspents?api-key-id=DEMO-4a5e1e4')
    .then(function (response) {
      var tx = wallet.createTXFromData(msg, response.data);
    }); 
  };
})

.controller('BalanceCtrl', function($scope, $http, wallet) {
  
  $scope.address = wallet.address;
  $scope.balance = 0;
  
  $http.get('https://api.chain.com/v2/testnet3/addresses/' + $scope.address 
    + '?api-key-id=DEMO-4a5e1e4')
  .then(function (response) {
      var data = response.data;
      $scope.balance = data[0].confirmed.balance;
  }); 
});
