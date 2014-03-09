'use strict';
angular.module('pdxStreetcarApp', [
        'ngCookies',
        'ngResource',
        'ngSanitize',
        'ngRoute',
        'ui.bootstrap',
        'ui.map',
        'geolocation'
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
            .otherwise({
                redirectTo: '/'
            });
    }).config(['$httpProvider', function ($httpProvider) {
        delete $httpProvider.defaults.headers.common['X-Requested-With']; //Fixes cross domain requests
    }]);
