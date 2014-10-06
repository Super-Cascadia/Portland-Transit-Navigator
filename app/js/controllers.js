/**
 * Created by jamesonnyeholt2 on 9/4/14.
 */

'use strict';
angular.module('pdxStreetcarApp')
    .controller('topNavigationCtrl', function ($scope, $routeParams, $log, $route, $location, geolocation, $state) {
        var self = this;

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

        self.geoLocate = function () {
            geoLocate();
        };
        self.topNavigationItems = [
            {
                displayName: "Home",
                route: "/",
                routeSecondary: ""
            },
            {
                displayName: "About",
                route: "/about"
            }
        ];
        self.isActive = function (navItem) {
            if (navItem.route === $state.current.url || navItem.routeSecondary === $state.current.url) {
                return true;
            }
        };
    })
    .controller('AboutCtrl', function () {
        var self = this;
    })
    .controller('MainCtrl', function ($scope, $log, $location, geolocation, timeCalcService) {

        // Variables
        $scope.showStreetcarServiceWarning = false;
        $scope.streetcarScheduleMessage = "";
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

        determineIfServiceIsAvailable();
    })
    .controller('RouteMapCtrl', function ($scope, $rootScope, $log, $q, $http, trimet, RouteColors, $timeout, feetToMeters, timeCalcService, formatRetrievedRoutes, trimetUtilities, routeMapInstance, RouteData, userLocation, mapLayers, Navigator, NearbyTransit, StopData) {
        'use strict';
        var self = this,
            map;
        self.stopIsSelected = false;
        self.distanceFromLocation = 660;
        self.nothingIsSelected = true;

        function getNearbyStops() {
            return NearbyTransit.get(self.userLatitude, self.userLongitude, self.distanceFromLocation)
                .then(function (exports) {
                    self.nearbyRoutes = exports.nearbyRoutes;
                    self.nearbyStops = exports.nearbyStops;
                    return exports;
                });
        }

        function getStreetCarData() {
            return RouteData.streetCar()
                .then(function (data) {
                    self.streetcar = data;
                    return data;
                })
                .then(function (data) {
                    var exports = RouteData.reconcileAlreadyEnabledRoutes('streetcar', data);
                    self.streetcar = exports;
                });
        }

        function getTrimetData() {
            return RouteData.trimet()
                .then(function (data) {
                    self.maxRail = data;
                    return data;
                })
                .then(function (data) {
                    var exports = RouteData.reconcileAlreadyEnabledRoutes('trimet', data);
                    self.maxRail = exports;
                });
        }

        function getBusData() {
            return RouteData.bus()
                .then(function (data) {
                    self.busRoutes = data;
                    return data;
                })
                .then(function (data) {
                    var exports = RouteData.reconcileAlreadyEnabledRoutes('bus', data);
                    self.busRoutes = exports;
                });
        }

        function toggleNearbyRoutes(route) {
            var exports = NearbyTransit.toggleNearbyRoute(route);
            self.nearbyRoutes = exports.nearbyRoutes;
        }

        function toggleNearbyRouteDirection(route, direction) {
            var exports = NearbyTransit.toggleNearbyRouteDirection(route, direction);
            self.nearbyRoutes = exports.nearbyRoutes;
        }

        function selectStop(stop, origin) {
            var stopMarker = StopData.createStopMarker(stop);
            StopData.memoizeIndividualStopMarker(stopMarker, stop);
            StopData.selectStopMarker(stopMarker);

            if (origin === 'routeDetails') {
                self.selectedRoute = RouteData.selectRouteStop(stop);
            } else if (origin === 'nearbyStops') {
                self.nearbyStops = NearbyTransit.toggleStopSelected(stop);
            } else {
                $log.log('Do something');
            }
        }

        function selectRoute(route) {

            function provideRouteId(route) {
                if (!route.routeId && route.route) {
                    route.routeId = route.route;
                }
            }

            provideRouteId(route);

            RouteData.getRouteData(parseInt(route.routeId))
                .then(function (data) {
                    self.selectedRoute = data;
                });
            RouteData.selectRoute(route);
        }

        self.isStreetCarRoute = trimetUtilities.isStreetCarRoute;
        self.isTrimetRoute = trimetUtilities.isTrimetRoute;
        self.toggleServiceBoundaryOverlay = mapLayers.toggleServiceBoundaryLayer;
        self.toggleTransitCenterOverlay = mapLayers.toggleTransitCenterLayer;
        self.toggleParkAndRidesOverlay = mapLayers.toggleParkAndRidesLayer;

        self.toggleStreetCarRoute = function toggleStreetCarRoute(route) {
            self.streetcar = Navigator.toggleRoute('streetcar', route);
        };

        self.toggleTrimetRoute = function toggleTrimetRoute(route) {
            self.maxRail = Navigator.toggleRoute('trimet', route);
        };

        self.toggleBusRoute = function toggleBusRoute(route) {
            self.busRoutes = Navigator.toggleRoute('bus', route);
        };

        // Toggle
        self.toggleNearbyRoute = toggleNearbyRoutes;
        self.toggleNearbyRouteDirection = toggleNearbyRouteDirection;
        // Selection
        self.selectStop = selectStop;
        self.selectRoute = selectRoute;
        // Get
        self.getNearbyRoutes = getNearbyStops;
        self.getStreetCarData = getStreetCarData;
        self.getTrimetData = getTrimetData;
        self.getBusData = getBusData;

        // Init
        function init() {
            function getUserLocation() {
                var deferred = $q.defer(),
                    userLocationMarker,
                    userLatLng;

                function handleNoGeolocation(errorFlag) {
                    var content;
                    if (errorFlag) {
                        content = 'Error: The Geolocation service failed.';
                    } else {
                        content = 'Error: Your browser doesn\'t support geolocation.';
                    }
                }

                function checkForGeolocation() {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function (position) {
                            self.userLatitude = position.coords.latitude;
                            self.userLongitude = position.coords.longitude;
                            userLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                            userLocationMarker = new google.maps.Marker({
                                map: routeMapInstance.map,
                                position: userLatLng,
                                animation: google.maps.Animation.DROP,
                                clickable: true,
                                title: "Current Location"
                            });
                            userLocation.set(userLocationMarker);
                            google.maps.event.addListener(userLocationMarker, 'click', function () {
                                map.panTo(userLatLng);
                            });
                            var exports = {
                                latitude: self.userLatitude,
                                longitude: self.userLongitude
                            };
                            deferred.resolve(exports);
                        }, function () {
                            handleNoGeolocation(true);
                            deferred.reject();
                        });
                    } else {
                        // Browser doesn't support Geolocation
                        handleNoGeolocation(false);
                        deferred.reject();
                    }
                }

                checkForGeolocation();
                return deferred.promise;
            }

            $timeout(function () {
                routeMapInstance.init()
                    .then(getUserLocation)
                    .then(function setUserLocationVariables(exports) {
                        self.latitude = exports.latitude;
                        self.longitude = exports.longitude;
                        return exports;
                    })
                    .then(getNearbyStops)
                    .then(mapLayers.load);
            }, 100);
        }

        init();

        function arrivalInformation(e, arrivalInfo) {
            self.selectedStop = arrivalInfo;
            self.stopIsSelected = true;
            if (arrivalInfo && arrivalInfo.resultSet && arrivalInfo.resultSet.arrival) {
                self.arrivalsUnavailable = false;
                self.remainingTime = arrivalInfo.resultSet.arrival[0].remainingTime;
                self.arrivalInfo = arrivalInfo.resultSet.arrival[0];
            } else {
                $log.warn('No arrival times were available');
                self.arrivalsUnavailable = true;
            }
        }

        function routeHoveredFromMap(e, data) {
            self.hoveredRoute = data;
            $scope.$apply();
        }

        function routeSelectedFromMap(e, routeId) {
            self.nothingIsSelected = false;
            RouteData.getRouteData(parseInt(routeId))
                .then(function (data) {
                    self.selectedRoute = data;
                    self.nothingIsSelected = false;
                    $scope.$apply();
                });
        }

        $rootScope.$on('arrivalInformation', arrivalInformation);
        $rootScope.$on('routeHoveredFromMap', routeHoveredFromMap);
        $rootScope.$on('routeSelectedFromMap', routeSelectedFromMap);

        self.closeDetailsPanel = function closeDetailsPanel() {
            self.selectedRoute = null;
            self.nothingIsSelected = true;
        };
    });
