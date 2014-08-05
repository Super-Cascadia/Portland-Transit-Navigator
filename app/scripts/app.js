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
    'ui.router',
    'pdxTrimet.api'
])
    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('root', {
                url: '',
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .state('home', {
                url: '/',
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .state('arrivals', {
                url: '/arrivals',
                templateUrl: 'views/arrivalsView.html',
                controller: 'ArrivalsMainCtrl'
            })
            .state('arrivals.route', {
                url: '/:route',
                templateUrl: 'views/transitTimeView/partials/primaryView.html',
                controller: 'PrimaryViewCtrl'
            })
            .state('arrivals.route.direction', {
                url: '/:direction',
                templateUrl: 'views/transitTimeView/partials/leftColumn.html',
                controller: 'RouteDirectionCtrl'
            })
            .state('arrivals.route.direction.stop', {
                url: '/:stop',
                controller: 'StopCtrl',
                templateUrl: 'views/transitTimeView/partials/stopSelector.html'
            })
            .state('routeMap', {
                url: '/routeMap',
                templateUrl: 'views/routeMap/routeMap.html',
                controller: 'RouteMapCtrl as routeMap'
            })
            .state('routeSchedule', {
                url: '/routeSchedule',
                templateUrl: 'views/routeSchedule/routeSchedule.html',
                controller: 'RouteScheduleCtrl'
            });
    })

    .config(['$httpProvider', function ($httpProvider) {
        delete $httpProvider.defaults.headers.common['X-Requested-With']; //Fixes cross domain requests
    }]);
