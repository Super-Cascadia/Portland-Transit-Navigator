angular.module('pdxStreetcarApp')
    .controller('StreetcarviewCtrl', function ($scope, $log, trimet, $interval, $q, timeCalcService) {
        'use strict';
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

        $scope.myMarkers = [];


        $scope.addMarker = function($event, $params) {
            $scope.myMarkers.push(new google.maps.Marker({
                map: $scope.myMap,
                position: $params[0].latLng
            }));
        };

        $scope.setZoomMessage = function(zoom) {
            $scope.zoomMessage = 'You just zoomed to '+zoom+'!';
            console.log(zoom,'zoomed')
        };

        $scope.openMarkerInfo = function(marker) {
            $scope.currentMarker = marker;
            $scope.currentMarkerLat = marker.getPosition().lat();
            $scope.currentMarkerLng = marker.getPosition().lng();
            $scope.myInfoWindow.open($scope.myMap, marker);
        };

        $scope.setMarkerPosition = function(marker, lat, lng) {
            marker.setPosition(new google.maps.LatLng(lat, lng));
        };

        function setMapForStop(selectedStop) {
            var deferred = $q.defer(),
                map,
                transitLayer,
                mapOptions,
                latLng;
            try {
                latLng = new google.maps.LatLng(selectedStop.lat, selectedStop.lng);
            } catch (e) {
                deferred.reject();
            }
            if (latLng) {
                mapOptions = {
                    center: latLng,
                    zoom: 17,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
                transitLayer = new google.maps.TransitLayer();
                new google.maps.Marker({
                    map: map,
                    position: latLng,
                    animation: google.maps.Animation.DROP,
                    title: selectedStop.desc
                });
                transitLayer.setMap(map);
                deferred.resolve();
            }
            return deferred.promise;
        }

        $scope.returnToAllStops = function () {
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
        };

        // State Scope Functions
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


        $scope.selectDirection = function (direction) {
            $scope.selectedDirection = direction;
            $scope.selectStop($scope.selectedDirection.stop[0]);
        };

        function setStop(stop) {
            $log.log(stop);
            $scope.mapOptions = null;
            $scope.stopIsSelected = true;
            $scope.selectedStop = stop;
            $scope.selectedStopLocId = stop.locid;
            getArrivals(stop)
                .then(function (arrivalInfo) {
                    timeCalcService.calculateRelativeTimes(arrivalInfo, $scope.queryTime)
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

        $scope.selectStop = function (stop) {
            if (stop) {
                if (_.isString(stop)) {
                    try {
                        stop = JSON.parse(stop);
                    } catch (e) {
                        $log.error("Could not parse the JSON string.");
                    }
                }
                if ($scope.selectedStop && $scope.selectedStop.locid === stop) {
                    $log.warn("This stop is already selected.  Doing nothing.");
                } else {
                    if (!stop.hasOwnProperty('desc')) {
                        stop = _.find($scope.selectedDirection.stop, function (item, key) {
                            if (item.locid === stop) {
                                return stop = item;
                            }
                        });
                        setStop(stop);
                    } else {
                        setStop(stop);
                    }

                }
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
