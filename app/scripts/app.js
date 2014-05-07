'use strict';
angular.module('pdxStreetcarApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'ui.bootstrap',
    'ui.map',
    'ui.utils',
    'chieffancypants.loadingBar',
    'ngAnimate',
    'geolocation',
    'ui.select2',
    'ui.router'
])
    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .state('streetcar', {
                url: '/streetcar',
                templateUrl: 'views/streetCarView.html',
                controller: 'StreetcarviewCtrl'
            })
            .state('streetcar.line', {
                url: '/:line',
                templateUrl: 'views/transitTimeView/partials/primaryView.html',
                controller: 'PrimaryViewCtrl'
            })
            .state('streetcar.line.direction', {
                url: '/:direction'
            })
            .state('streetcar.line.direction.stop', {
                url: '/:stop'
            })
            .state('routeMap', {
                url: '/routeMap',
                templateUrl: 'views/routeMap.html',
                controller: 'RouteMapCtrl'
            })
            .state('/routeSchedule', {
                url: '/routeSchedule',
                templateUrl: 'views/routeSchedule/routeSchedule.html',
                controller: 'RouteScheduleCtrl'
            });
    })

    .config(['$httpProvider', function ($httpProvider) {
        delete $httpProvider.defaults.headers.common['X-Requested-With']; //Fixes cross domain requests
    }]);
