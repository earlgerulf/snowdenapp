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

.controller('PlaylistsCtrl', function($scope, wallet, blockchain) {
  
  $scope.$watch(
    function(){ return wallet.address },

    function(newVal) {
      $scope.playlists = [
        { title: wallet.address, id: 1 },
        { title: wallet.mnemonic, id: 2 },
        { title: 'Dubstep', id: 3 },
        { title: 'Indie', id: 4 },
        { title: 'Rap', id: 5 },
        { title: 'Cowbell', id: 6 }
      ];
    }
  )

  
  $scope.playlists = [
    { title: wallet.address, id: 1 },
    { title: wallet.mnemonic, id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
})


.controller('ContactlistsCtrl', function($scope) {
  
  $scope.contacts = [
    { address: 'mgDLbirZsaZ8jRTfPYW6Vv5z4KkizqzCLx' },
    { address: 'mqdfWTbyZGHANkidLijPjR4La63X49DJxT' }
  ];
})

.controller('ContactlistCtrl', function($scope, $stateParams) {
  
  $scope.messages = [
    { text: 'Hello' },
    { text: 'Hi' }
  ];
  
  $scope.message = { text: "" };
  
  $scope.addMessage = function(message) {
    $scope.messages.push({text: message});
    //we reset the text input field to an empty string
    $scope.message = { text: "" };
  };
})

.controller('BalanceCtrl', function($scope, $http, wallet) {
  
  $scope.address = wallet.address;
  $scope.balance = 0;
  
  $http.get('https://api.chain.com/v2/testnet3/addresses/' +$scope.address 
    + '?api-key-id=DEMO-4a5e1e4')
  .then(function (response) {
      var data = response.data;
      $scope.balance = data[0].confirmed.balance;
  }); 
});
