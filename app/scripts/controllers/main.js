'use strict';
angular.module('pdxStreetcarApp')
    .controller('MainCtrl', function ($scope, $log, $location, geolocation, timeCalcService) {

        // Variables
        $scope.showStreetcarServiceWarning = false;
        $scope.streetcarScheduleMessage = "";

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

        function determineIfServiceIsAvailable() {
            timeCalcService.isStreetCarOutOfService()
                .then(function (differenceToStartTime, differenceToEndTime) {
                    $log.info("Streetcar is currently available.  Time is within schedule.");
                    $scope.streetcarScheduleMessage = "The Streetcar is currently in service.";
                    $scope.showStreetcarServiceWarning = false;
                }, function (differenceToStartTime, differenceToEndTime) {
                    $log.warn("Streetcar not currently available.  Time is outside of schedule.");
                    $scope.streetcarScheduleMessage = "The Streetcar is currently out of service.";
                    $scope.showStreetcarServiceWarning = true;
                });
        }

        $scope.geoLocate = function () {
            geoLocate();
        };

        determineIfServiceIsAvailable();
    });
