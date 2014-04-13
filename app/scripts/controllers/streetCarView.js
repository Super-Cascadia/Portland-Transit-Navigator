angular.module('pdxStreetcarApp')
    .controller('StreetcarviewCtrl', function ($scope, $log, trimet, $interval, $q, timeCalcService) {
        'use strict';

        $scope.streetCarArrivalsView = true;
        $scope.timeTableView = false;
        $scope.routeMapView = false;

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
            //            $interval(function () {
            //                if ($scope.selectedStop) {
            //                    $log.info("Refreshed arrival times.");
            //                    getArrivals($scope.selectedStop);
            //                }
            //            }, 10000);
        }

        function setMapForStop(selectedStop) {
            var deferred = $q.defer(),
                map,
                content,
                transitLayer,
                stopInfoWindowOptions,
                userLocationMarker,
                stopMarkerInfoWindow,
                userLatLng,
                stopMarker,
                mapOptions,
                stopLatLng;

            function handleNoGeolocation(errorFlag) {
                if (errorFlag) {
                    content = 'Error: The Geolocation service failed.';
                } else {
                    content = 'Error: Your browser doesn\'t support geolocation.';
                }
            }

            function setStopMarker() {
                stopMarker = new google.maps.Marker({
                    map: map,
                    position: stopLatLng,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 5
                    },
                    animation: google.maps.Animation.DROP,
                    clickable: true,
                    title: selectedStop.desc
                });
                google.maps.event.addListener(stopMarker, 'click', function () {
                    map.panTo(stopMarker.getPosition());
                });
                stopInfoWindowOptions = {
                    map: map,
                    position: stopLatLng,
                    content: selectedStop.desc
                };
                stopMarkerInfoWindow = new google.maps.InfoWindow(stopInfoWindowOptions);
            }

            function setUserLocationMarker() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        userLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        userLocationMarker = new google.maps.Marker({
                            map: map,
                            position: userLatLng,
                            animation: google.maps.Animation.DROP,
                            clickable: true,
                            title: "Current Location"
                        });
                        google.maps.event.addListener(userLocationMarker, 'click', function () {
                            map.panTo(userLatLng);
                        });
                    }, function () {
                        handleNoGeolocation(true);
                    });
                } else {
                    // Browser doesn't support Geolocation
                    handleNoGeolocation(false);
                }
            }

            function setMapWithOptions() {
                stopLatLng = new google.maps.LatLng(selectedStop.lat, selectedStop.lng);
                mapOptions = {
                    center: stopLatLng,
                    zoom: 17,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
                transitLayer = new google.maps.TransitLayer();
            }

            setMapWithOptions();
            if (stopLatLng) {
                setStopMarker();
                setUserLocationMarker();
                transitLayer.setMap(map);
                deferred.resolve();
            }
            return deferred.promise;
        }

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

        $scope.showRouteMap = function () {
            $scope.streetCarArrivalsView = false;
            $scope.timeTableView = false;
            $scope.routeMapView = true;
        };

        $scope.showRouteSchedule = function () {
            $scope.streetCarArrivalsView = false;
            $scope.routeMapView = false;
            $scope.timeTableView = false;
        };

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

        function initializeStreetCarView() {
            $q.all([initState(), getStreetcarRoutes()])
                .then(function () {
                    $log.log("Page was initialized.");
                }, function () {
                    $log.error("Page could not be initialized.");
                });
        }

        initializeStreetCarView();
    });
