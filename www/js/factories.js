angular.module('starter.factories', [])

.factory('wallet', function() {
     
    var factory = {};
 
    factory.getAddress = function() {
        return "122312313"
    }
 
    return factory;
});