'use strict';

angular.module('pdxStreetcarApp')
  .controller('StreetcarviewCtrl', function ($scope, trimet) {

        function initState() {
            $scope.routeIsSelected = false;
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
        }
        function getStreetcarRoutes() {
            trimet.streetcar.getRoutes(function getSuccess(response) {
                $scope.routes = response.resultSet.route;
                $scope.selectRoute($scope.routes[0]);
                $scope.selectDirection($scope.selectedRoute.dir[0]);
                $scope.selectStop($scope.selectedDirection.stop[0]);
            }, function getError(response) {

            });
        }
        function calculateRelativeTimes(arrivalInfo) {
            var arrivals = arrivalInfo.resultSet.arrival;
            for (var i = 0; i < arrivals.length; i += 1) {
                var currentArrival = arrivals[i];
                calculateDifferenceInTimes(currentArrival, function (response) {
                    $scope.remainingTime = response;
                })
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
        function initTrimet() {
            initState();
            getStreetcarRoutes();
        }
        $scope.returnToAllStops = function () {
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
        };
        $scope.selectDirection = function (direction) {
            $scope.selectedDirection = direction;
        };
        $scope.selectStop = function (stop) {
            console.log(stop);
            $scope.stopIsSelected = true;
            $scope.selectedStop = stop;
            var latLng = new google.maps.LatLng(stop.lat, stop.lng);
            $scope.mapOptions = {
                center: latLng,
                zoom: 17,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            new google.maps.Marker({
                map: $scope.myMap,
                position: latLng
            });
            getArrivals(stop);
        };
        $scope.isStopSelected = function (stop) {
            if ($scope.selectedStop) {
                return stop.locid === $scope.selectedStop.locid;
            }
        };
        $scope.isDirectionSelected = function (direction) {
            if ($scope.selectedDirection) {
                return direction.dir === $scope.selectedDirection.dir;
            }
        };
        $scope.isRouteSelected = function (route) {
            if ($scope.selectedRoute) {
                return route.route === $scope.selectedRoute.route;
            }
        };
        $scope.selectRoute = function (route) {
            $scope.selectedRoute = route;
            $scope.selectDirection($scope.selectedRoute.dir[0]);
            $scope.selectStop($scope.selectedDirection.stop[0]);
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
            if (arrival.estimated) {
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
                if (diff.minutes < 3) {
                    return true;
                }
            });
        };
        $scope.isArrivalSoon = function (arrival) {
            calculateDifferenceInTimes(arrival, function (diff) {
                if (diff.minutes < 7) {
                    return true;
                }
            });
        };
        return initTrimet();
  });
