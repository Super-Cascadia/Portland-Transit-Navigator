'use strict';
angular.module('pdxStreetcarApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'ui.bootstrap',
    'ui.map',
    'ui.utils',
    'geolocation',
    'ui.select2'
])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .when('/streetcar', {
                templateUrl: 'views/streetCarView.html',
                controller: 'StreetcarviewCtrl'
            })
            .when('/trimet', {
                templateUrl: 'views/trimetView.html',
                controller: 'TrimetviewCtrl'
            })
            .when('/bus', {
                templateUrl: 'views/busView.html',
                controller: 'BusviewCtrl'
            })
            .when('/nearbyStops/:lat/:lng/:distFeet', {
                templateUrl: 'views/nearbyStops.html',
                controller: 'NearbystopsCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });
    }).config(['$httpProvider', function ($httpProvider) {
        delete $httpProvider.defaults.headers.common['X-Requested-With']; //Fixes cross domain requests
    }]);
