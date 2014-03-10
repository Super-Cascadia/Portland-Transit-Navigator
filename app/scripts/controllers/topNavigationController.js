'use strict';
angular.module('pdxStreetcarApp')
    .controller('topNavigationCtrl', function ($scope, $routeParams, $route, $location, geolocation) {
        function geoLocate() {
            geolocation.getLocation()
                .then(function (data) {
                    $scope.coords = {
                        lat: data.coords.latitude,
                        long: data.coords.longitude
                    };
                    $location.path('/nearbyStops/' + $scope.coords.lat + '/' + $scope.coords.long);
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
                displayName: "Street Car",
                route: "/streetcar"
            },
            {
                displayName: "TriMet",
                route: "/trimet"
            },
            {
                displayName: "Bus",
                route: "/bus"
            }
        ];
        $scope.topNavItemClick = function (navItem) {
            console.log(navItem);
        };
        $scope.isActive = function (navItem) {
            if (navItem.route === $route.current.$$route.originalPath) {
                return true;
            }
        };
    });
