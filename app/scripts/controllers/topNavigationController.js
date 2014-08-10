'use strict';
angular.module('pdxStreetcarApp')
    .controller('topNavigationCtrl', function ($scope, $routeParams, $log, $route, $location, geolocation, $state, $stateParams) {
        function geoLocate() {
            $log.log("Using Geolocation to find nearby stops.");
            geolocation.getLocation()
                .then(function (data) {
                    $scope.distanceFeet = 1320;
                    $scope.coords = {
                        lat: data.coords.latitude,
                        long: data.coords.longitude
                    };
                    $location.path('/nearbyStops/' + $scope.coords.lat + '/' + $scope.coords.long + '/' + $scope.distanceFeet);
                });
        }

        $scope.geoLocate = function () {
            geoLocate();
        };
        $scope.topNavigationItems = [
            {
                displayName: "Home",
                route: "/"
            },
            {
                displayName: "Map",
                route: "/routeMap"
            }
        ];
        $scope.topNavItemClick = function (navItem) {
            $log.log(navItem);
        };
        $scope.isActive = function (navItem) {
            if (navItem.route === $state.current.url) {
                return true;
            }
        };
    });
