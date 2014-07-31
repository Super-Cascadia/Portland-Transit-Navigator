angular.module('pdxStreetcarApp')
    .controller('ArrivalsMainCtrl', function ($scope, $log, trimet, $interval, $q, timeCalcService, $stateParams, $state) {
        'use strict';
        // Scope Variables
        $scope.streetCarArrivalsView = true;
        $scope.timeTableView = false;
        $scope.routeMapView = false;
        function getArrivals(stop) {
            var deferred = $q.defer();
            trimet.getArrivalsForStop(stop)
                .then(function arrivalSuccess(arrivalInfo) {
                    deferred.resolve(arrivalInfo);
                }, function arrivalError(response) {
                    $log.error("Could not get arrivals for streetcar stop.");
                    deferred.reject();
                });
            return deferred.promise;
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
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    styles: [{featureType:"administrative",stylers:[{visibility:"off"}]},{featureType:"poi",stylers:[{visibility:"simplified"}]},{featureType:"road",elementType:"labels",stylers:[{visibility:"simplified"}]},{featureType:"water",stylers:[{visibility:"simplified"}]},{featureType:"transit",stylers:[{visibility:"simplified"}]},{featureType:"landscape",stylers:[{visibility:"simplified"}]},{featureType:"road.highway",stylers:[{visibility:"off"}]},{featureType:"road.local",stylers:[{visibility:"on"}]},{featureType:"road.highway",elementType:"geometry",stylers:[{visibility:"on"}]},{featureType:"water",stylers:[{color:"#84afa3"},{lightness:52}]},{stylers:[{saturation:-17},{gamma:0.36}]},{featureType:"transit.line",elementType:"geometry",stylers:[{color:"#3f518c"}]}]
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

        // State Change Functions
        function updateRoute() {
            $state.go('arrivals.route.direction.stop', {
                route: $scope.selectedRoute.route,
                direction: $scope.selectedDirection.dir,
                stop: $scope.selectedStop.locid
            });
        }

        function goToRoute(route, direction, stop) {
            $state.go('arrivals.route.direction.stop', {
                route: route,
                direction: direction,
                stop: stop
            });
        }

        function findRouteById(routes, routeId) {
            return _.find(routes, function (route) {
                if (route.route == routeId) {
                    return route;
                }
            });
        }

        function findDirectionById(directions, directionId) {
            return _.find(directions, function (direction) {
                if (direction.dir == directionId) {
                    return direction;
                }
            });
        }

        function findStopById(stops, stopId) {
            return _.find(stops, function (stop) {
                if (stop.locid == stopId) {
                    return stop;
                }
            });
        }

        // Transit Info Param Setting Functions
        function setConfigurationVariables(stateParams) {
            var routeId = stateParams.route,
                directionId = stateParams.direction,
                stopId = stateParams.stop;
            $scope.selectedRoute = findRouteById($scope.routes, routeId);
            $scope.selectedDirection = findDirectionById($scope.selectedRoute.dir, directionId);
            $scope.selectedStop = findStopById($scope.selectedDirection.stop, stopId);
            $scope.selectStop($scope.selectedStop);
        }

        function selectDefaulStateParams() {
            $scope.selectedRoute = $scope.routes[0];
            $scope.selectDirection($scope.selectedRoute.dir[0]);
            $scope.selectStop($scope.selectedDirection.stop[0]);
        }

        // Transit Info Change Functions
        function selectRoute(route) {
            $scope.selectedRoute = route;
            $scope.selectDirection($scope.selectedRoute.dir[0]);
            $scope.selectStop($scope.selectedDirection.stop[0]);
            updateRoute();
        }

        function selectDirection(direction) {
            $scope.selectedDirection = direction;
            $scope.selectStop($scope.selectedDirection.stop[0]);
            updateRoute();
        }

        function setStop(stop) {
            $log.log(stop);
            $scope.mapOptions = null;
            $scope.stopIsSelected = true;
            $scope.selectedStop = stop;
            $scope.selectedStopLocId = stop.locid;
            getArrivals(stop)
                .then(function (arrivalInfo) {
                    $scope.queryTime = arrivalInfo.resultSet.queryTime;
                    timeCalcService.calculateRelativeTimes(arrivalInfo, $scope.queryTime)
                        .then(function (arrivalInfo) {
                            $scope.selectedStop.arrivalInfo = arrivalInfo;
                            $scope.remainingTime = $scope.selectedStop.arrivalInfo.resultSet.arrival[0].remainingTime;
                            $scope.arrivalInfo = $scope.selectedStop.arrivalInfo.resultSet.arrival[0];
                            setMapForStop(stop);
                        }, function () {
                            $log.error("Could to calculate the relative Times.");
                        });
                }, function () {
                    $log.error("Could not get arrivals.");
                });
        }

        function selectStop(stop) {
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
                        stop = _.find($scope.selectedDirection.stop, function (item) {
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
            updateRoute();
        }

        // Public Functions
        $scope.selectDirection = selectDirection;
        $scope.selectRoute = selectRoute;
        $scope.selectStop = selectStop;
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
        function getStreetcarRoutes() {
            var deferred = $q.defer();
            trimet.streetcar.getRoutes()
                .then(function getSuccess(response) {
                    deferred.resolve(response);
                }, function getError(response) {
                    $log.error("Could not get routes for streetcar.");
                    deferred.reject();
                });
            return deferred.promise;
        }

        function initializeStreetCarView() {
            $scope.routeIsSelected = false;
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
            getStreetcarRoutes()
                .then(function (response) {
                    $scope.routes = response.resultSet.route;
                    if ($state.params && $state.params.direction && $state.params.route && $state.params.stop) {
                        setConfigurationVariables($state.params);
                        goToRoute($state.params.route, $state.params.direction, $state.params.stop);
                    } else {
                        selectDefaulStateParams();
                        goToRoute($scope.selectedRoute.route, $scope.selectedDirection.dir, $scope.selectedStop.locid);
                    }
                }, function () {
                    $log.error("Page could not be initialized.");
                });
        }

        initializeStreetCarView();
    })

    .controller('PrimaryViewCtrl', function ($scope, $stateParams) {
        $scope.isRouteSelected = function (route) {
            if ($scope.selectedRoute && route) {
                return route.route === $stateParams.route;
            }
        };
    })

    .controller('StopCtrl', function ($scope, $state, $stateParams) {
        //        $scope.goToSpecifiedRoute($stateParams.line, $stateParams.direction, $stateParams.stop);
    })

    .controller('RouteDirectionCtrl', function ($scope, $state, $stateParams) {
        //        $scope.selectedDirection = $stateParams.direction;
    });