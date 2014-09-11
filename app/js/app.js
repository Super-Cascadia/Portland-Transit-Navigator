'use strict';
angular.module('pdxStreetcarApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'ui.bootstrap',
    'ui.utils',
    'ngAnimate',
    'geolocation',
    'ui.select2',
    'ui.router'
])
    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('root', {
                url: '',
                templateUrl: 'views/routeMap/routeMap.html',
                controller: 'RouteMapCtrl as routeMap'
            })
            .state('home', {
                url: '/',
                templateUrl: 'views/routeMap/routeMap.html',
                controller: 'RouteMapCtrl as routeMap'
            })
            .state('about', {
                url: '/about',
                templateUrl: 'views/about/about.html',
                controller: 'AboutCtrl as about'
            });
    })

    .config(['$httpProvider', function ($httpProvider, $state) {
        delete $httpProvider.defaults.headers.common['X-Requested-With']; //Fixes cross domain requests
    }]);
