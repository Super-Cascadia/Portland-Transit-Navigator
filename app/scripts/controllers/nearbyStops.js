'use strict';

angular.module('pdxStreetcarApp')
  .controller('NearbystopsCtrl', function ($scope, $log, $routeParams, $location, trimet, geolocation) {

        $scope.filterStopRoutes = function(items) {
            var result = {};
            angular.forEach(items, function(value, key) {
                if (value.hasOwnProperty('type')) {
                    if (value.type === 'R') {
                        result[key] = value;
                    }
                }
            });
            return result;
        };

        $scope.filterStopsThatLackRoutes = function(stops) {
            var result = {};
            angular.forEach(stops, function(stop, i) {
                if (stop.hasOwnProperty('route')) {
                    var arrivals = $scope.filterStopRoutes(stop.route);
                    if (arrivals.length > 0) {
                        result[i] = stop;
                    }
                }
            });
            return result;
        };

        $scope.distanceOptions = [
            {
                value: 600,
                displayName: "1/8 Mile"
            },
            {
                value: 1320,
                displayName: "1/4 Mile"
            },
            {
                value: 2640,
                displayName: "1/2 Mile"
            },
            {
                value: 3960,
                displayName: "3/4 Mile"
            },
            {
                value: 5280,
                displayName: "1 Mile"
            }
        ];

        function calculateRelativeTimes(arrivalInfo) {
            var arrivals = arrivalInfo.resultSet.arrival;
            for (var i = 0; i < arrivals.length; i += 1) {
                var currentArrival = arrivals[i];
                calculateDifferenceInTimes(currentArrival, function (response) {
                    $scope.remainingTime = response;
                });
            }
        }

        function getArrivals(stop) {
            trimet.getArrivalsForStop(stop, function arrivalSuccess(arrivalInfo) {
                $scope.selectedStop.arrivalInfo = arrivalInfo;
                $scope.queryTime = arrivalInfo.resultSet.queryTime;
                calculateRelativeTimes(arrivalInfo);
            }, function arrivalError(response) {

            });
        }

        function getStopsForLocation() {
            trimet.getStopsAroundLocation($routeParams.lat, $routeParams.lng, $routeParams.distFeet, function (response) {
                $scope.distanceFeet = $routeParams.distFeet;
                $scope.nearbyStops = response.resultSet;
                $scope.selectStop($scope.nearbyStops.location[0]);
                $log.log(response);
            }, function (response) {
                $log.error(response);
            });
        }
        getStopsForLocation();

        $scope.updateDistance = function (distanceFeet) {
            $location.path('/nearbyStops/' + $routeParams.lat + '/' + $routeParams.lng + '/' + distanceFeet);
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
            if (arrival.estimated) {
                estimatedArrivalTime = new Date(arrival.estimated);
            } else {
                estimatedArrivalTime = new Date(arrival.scheduled);
            }
            get_time_difference(queryTime, estimatedArrivalTime, function (diff) {
                return callback(diff);
            });
        }


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
