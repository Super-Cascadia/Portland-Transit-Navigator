'use strict';
angular.module('pdxStreetcarApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'ui.bootstrap',
    'ui.map',
    'ui.utils',
//    'chieffancypants.loadingBar',
    'ngAnimate',
    'geolocation',
    'ui.select2',
    'ui.router'
//    'trimet.api'
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
            .state('streetcar', {
                url: '/streetcar',
                templateUrl: 'views/streetCarView.html',
                controller: 'StreetcarviewCtrl'
            })
            .state('streetcar.route', {
                url: '/:route',
                templateUrl: 'views/transitTimeView/partials/primaryView.html',
                controller: 'PrimaryViewCtrl'
            })
            .state('streetcar.route.direction', {
                url: '/:direction',
                templateUrl: 'views/transitTimeView/partials/leftColumn.html',
                controller: 'StreetCarRouteDirectionCtrl'
            })
            .state('streetcar.route.direction.stop', {
                url: '/:stop',
                controller: 'StreetCarStopCtrl',
                templateUrl: 'views/transitTimeView/partials/stopSelector.html'
            })
            .state('routeMap', {
                url: '/routeMap',
                templateUrl: 'views/routeMap.html',
                controller: 'RouteMapCtrl'
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
