// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('snowden', ['ionic', 'snowden.controllers', 'angularLocalStorage'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "www/templates/menu.html",
    controller: 'AppCtrl'
  })

  .state('app.login', {
    url: "/login",
    views: {
      'menuContent': {
        templateUrl: "www/templates/login.html",
          controller: 'AppCtrl'
      }
    }
  })

  .state('app.balance', {
    url: "/balance",
    views: {
      'menuContent': {
        templateUrl: "www/templates/balance.html",
          controller: 'BalanceCtrl'
      }
    }
  })
  
  
  .state('app.contacts', {
      url: "/contacts",
      views: {
        'menuContent': {
          templateUrl: "www/templates/contacts.html",
          controller: 'ContactlistsCtrl'
        }
      }
    })

  .state('app.contact', {
    url: "/contacts/:contactId",
    views: {
      'menuContent': {
        templateUrl: "www/templates/contact.html",
        controller: 'ContactlistCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/contacts');
});
