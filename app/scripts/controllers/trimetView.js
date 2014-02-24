'use strict';

angular.module('pdxStreetcarApp')
  .controller('TrimetviewCtrl', function ($scope, trimet) {
        $scope.map = {
            center: {
                latitude: 45,
                longitude: -73
            },
            zoom: 18
        };
        function initState() {
            $scope.routeIsSelected = false;
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
        }
        function getRailRoutes() {
            trimet.rail.getRoutes(function getSuccess(response) {
                $scope.routes = response.resultSet.route;
                $scope.selectRoute($scope.routes[0]);
            }, function getError(response) {

            });
        }
        function getStreetcarRoutes() {
            trimet.streetcar.getRoutes(function getSuccess(response) {
                $scope.routes = response.resultSet.route;
                $scope.selectRoute($scope.routes[0]);
            }, function getError(response) {

            });
        }
        function getArrivals(stop) {
            trimet.getArrivalsForStop(stop, function arrivalSuccess(arrivalInfo) {
                $scope.selectedStop.arrivalInfo = arrivalInfo;
                $scope.queryTime = arrivalInfo.resultSet.queryTime;
            }, function arrivalError(response) {

            });
        }
        function initTrimet() {
            initState();
            getStreetcarRoutes();
            return getRailRoutes();
        }
        $scope.returnToAllStops = function () {
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
        };
        $scope.selectStop = function (stop) {
            console.log(stop);
            $scope.stopIsSelected = true;
            $scope.selectedStop = stop;
            getArrivals(stop);
        };
        $scope.isRouteSelected = function (route) {
            if ($scope.selectedRoute) {
                return route.route === $scope.selectedRoute.route;
            }
        };
        $scope.selectRoute = function (route) {
            $scope.selectedRoute = route;
            $scope.routeIsSelected = true;
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
        };
        $scope.refreshArrivals = function (stop) {
            getArrivals(stop);
        };

        function get_time_difference(earlierDate, laterDate, callback) {
            var nTotalDiff = laterDate.getTime() - earlierDate.getTime();
            var oDiff = new Object();
            oDiff.days = Math.floor(nTotalDiff/1000/60/60/24);
            nTotalDiff -= oDiff.days*1000*60*60*24;
            oDiff.hours = Math.floor(nTotalDiff/1000/60/60);
            nTotalDiff -= oDiff.hours*1000*60*60;
            oDiff.minutes = Math.floor(nTotalDiff/1000/60);
            nTotalDiff -= oDiff.minutes*1000*60;
            oDiff.seconds = Math.floor(nTotalDiff/1000);
            return callback(oDiff);
        }
        function calculateDifferenceInTimes (arrival, callback) {
            var estimatedArrivalTime;
            var queryTime = new Date($scope.queryTime);
            if (arrival.estiamted) {
                estimatedArrivalTime = new Date(arrival.estimated);
            } else {
                estimatedArrivalTime = new Date(arrival.scheduled);
            }
            get_time_difference(queryTime, estimatedArrivalTime, function (diff) {
                return callback(diff);
            });
        }
        $scope.isArrivalImminent = function (arrival) {
            calculateDifferenceInTimes(arrival, function (diff) {
                if (diff.minutes < 40) {
                    arrival.imminent = true;
                }
            });
        };
        $scope.isArrivalSoon = function (arrival) {
            calculateDifferenceInTimes(arrival, function (diff) {
                if (diff.minutes < 7) {
                    arrival.soon = true;
                }
            });
        };

        return initTrimet();
  });
