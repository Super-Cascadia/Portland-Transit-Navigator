'use strict';
angular.module('pdxStreetcarApp')
    .controller('StreetcarviewCtrl', function ($scope, $log, trimet, $interval, $q, timeCalcService) {
        function getArrivals(stop) {
            var deferred = $q.defer();
            trimet.getArrivalsForStop(stop, function arrivalSuccess(arrivalInfo) {
                $scope.selectedStop.arrivalInfo = arrivalInfo;
                $scope.queryTime = arrivalInfo.resultSet.queryTime;
                deferred.resolve(arrivalInfo);
            }, function arrivalError(response) {
                $log.error("Could not get arrivals for streetcar stop.");
                deferred.reject();
            });
            return deferred.promise;
        }

        function refreshArrivalsOnTimeout() {
            $interval(function () {
                if ($scope.selectedStop) {
                    $log.info("Refreshed arrival times.");
                    getArrivals($scope.selectedStop);
                }
            }, 10000);
        }

        function setMapForStop(selectedStop) {
            var deferred = $q.defer(),
                latLng;
            try {
                latLng = new google.maps.LatLng(selectedStop.lat, selectedStop.lng);
            } catch (e) {
                deferred.reject();
            }
            if (latLng) {
                $scope.mapOptions = {
                    center: latLng,
                    zoom: 17,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                try {
                    new google.maps.Marker({
                        map: $scope.myMap,
                        position: latLng
                    });
                } catch (e) {
                    deferred.reject();
                }
                deferred.resolve();
            }
            return deferred.promise;
        }

        $scope.returnToAllStops = function () {
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
        };
        $scope.selectDirection = function (direction) {
            $scope.selectedDirection = direction;
        };
        $scope.selectStop = function (stop) {
            if (stop) {
                if (_.isString(stop)) {
                    try {
                        stop = JSON.parse(stop);
                    } catch (e) {
                        $log.error("Could not parse the JSON string.");
                    }
                }
                $log.log(stop);
                $scope.mapOptions = null;
                $scope.stopIsSelected = true;
                $scope.selectedStop = stop;
                getArrivals(stop)
                    .then(function (arrivalInfo) {
                        timeCalcService.calculateRelativeTimes(arrivalInfo)
                            .then(function (remainingTime) {
                                $scope.remainingTime = remainingTime;
                                setMapForStop(stop);
                                refreshArrivalsOnTimeout();
                            }, function () {
                            });
                    }, function () {
                        $log.error("Could not get arrivals.");
                    });
            }
        };
        $scope.isStopSelected = function (stop) {
            if ($scope.selectedStop && stop) {
                return stop.locid === $scope.selectedStop.locid;
            }
        };
        $scope.isDirectionSelected = function (direction) {
            if ($scope.selectedDirection && direction) {
                return direction.dir === $scope.selectedDirection.dir;
            }
        };
        $scope.isRouteSelected = function (route) {
            if ($scope.selectedRoute && route) {
                return route.route === $scope.selectedRoute.route;
            }
        };
        $scope.selectRoute = function (route) {
            $scope.selectedRoute = route;
            $scope.selectDirection($scope.selectedRoute.dir[0]);
            $scope.selectStop($scope.selectedDirection.stop[0]);
        };
        $scope.refreshArrivals = function (stop) {
            getArrivals(stop)
                .then(function () {
                    $log.log("Arrivals were refreshed.");
                }, function () {
                    $log.error("Could not get Arrivals.");
                });
        };
        $scope.isArrivalImminent = function (arrival) {
            timeCalcService.calculateDifferenceInTimes(arrival, $scope.queryTime)
                .then(function (diff) {
                    if (diff.minutes < 3) {
                        return true;
                    }
                }, function () {
                    $log.error("Could not calculate the difference in times.");
                });
        };
        $scope.isArrivalSoon = function (arrival) {
            timeCalcService.calculateDifferenceInTimes(arrival, $scope.queryTime)
                .then(function (diff) {
                    if (diff.minutes < 7) {
                        return true;
                    }
                }, function () {
                    $log.error("Could not calculate the difference in times.");
                });
        };
        // Initialization
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
                $log.error("Could not get routes for streetcar.");
            });
        }

        function initTrimet() {
            $q.all([initState(), getStreetcarRoutes()])
                .then(function () {
                    $log.log("Page was initialized.");
                }, function () {
                    $log.error("Page could not be initialized.");
                });
        }

        initTrimet();
    });
