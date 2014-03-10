'use strict';

angular.module('pdxStreetcarApp')
  .controller('NearbystopsCtrl', function ($scope, $log, $routeParams, trimet) {

        function getArrivals(stop) {
            trimet.getArrivalsForStop(stop, function arrivalSuccess(arrivalInfo) {
                $scope.selectedStop.arrivalInfo = arrivalInfo;
                $scope.queryTime = arrivalInfo.resultSet.queryTime;
            }, function arrivalError(response) {

            });
        }

        function getStopsForLocation() {
            trimet.getStopsAroundLocation($routeParams.lat, $routeParams.lng, 500, function (response) {
                $scope.nearbyStops = response.resultSet;
                $scope.selectStop($scope.nearbyStops.location[0]);
                $log.log(response);
            }, function (response) {
                $log.error(response);
            });
        }
        getStopsForLocation();

        $scope.selectStop = function (stop) {
            if ($scope.stopIsSelected === true && stop.locid === $scope.selectedStop.locid) {
                return;
            }
            console.log(stop);
            $scope.stopIsSelected = true;
            $scope.selectedStop = stop;
            getArrivals(stop);
        };
        $scope.isStopSelected = function (stop) {
            if ($scope.selectedStop) {
                return stop.locid === $scope.selectedStop.locid;
            }
        };
  });
