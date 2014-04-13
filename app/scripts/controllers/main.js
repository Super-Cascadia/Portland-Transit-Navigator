'use strict';
angular.module('pdxStreetcarApp')
    .controller('MainCtrl', function ($scope, $log, $location, geolocation) {
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
    });
