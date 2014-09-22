/**
 * Created by jamesonnyeholt2 on 9/4/14.
 */

angular.module('pdxStreetcarApp')

    .service('NearbyTransit', function (StopData, RouteData, trimet, RouteColors, routeMapInstance, feetToMeters, userLocation) {

        "use strict";

        var self = this;

        self.nearbyStopMarkers = {};
        self.nearbyStops = null;
        self.nearbyRoutes = {};
        self.stopRadiusIndicator = null;

        self.get = function get(latitude, longitude, distanceFromLocation) {
            var radiusInFeet = distanceFromLocation || 660;

            function initializeModel(data) {

                function setRadiusAroundUser() {
                    if (self.stopRadiusIndicator) {
                        self.stopRadiusIndicator.setMap(null);
                    }

                    self.stopRadiusIndicator = new google.maps.Circle({
                        map: routeMapInstance.map,
                        radius: feetToMeters(radiusInFeet),    // 10 miles in metres
                        strokeColor: '#AA0000',
                        fillColor: '#AA0000'
                    });

                    self.stopRadiusIndicator.bindTo('center', userLocation.marker, 'position');
                }

                setRadiusAroundUser();
                StopData.clearNearbyStopMarkers();
                RouteData.clearNearbyRoutes();
                self.nearbyRoutes = {};

                return data;
            }

            function storeRetrievedRoutes(data) {

                RouteData.memoizeNearbyRoutes(data);

                return data;
            }

            function storeRetrievedStops(data) {

                return data;
            }

            function provideListOfNearbyStops(data) {
                var locations = data.resultSet.location;
                _.forEach(locations, function (stop) {
                    stop.enabled = true;
                    stop.selected = false;
                });
                self.nearbyStops = locations;
                return data;
            }

            function provideListOfNearbyRoutes(data) {
                var locations = data.resultSet.location;

                function createNearbyRouteDictionary(locations) {
                    var routes = {};

                    function placeRoute(route, stop) {
                        var routeId = route.route,
                            routeInst;

                        if (!routes[routeId]) {
                            routes[routeId] = {};
                            routes[routeId].desc = route.desc;
                            routes[routeId].routeId = route.route;
                            routes[routeId].type = route.type;
                        }

                        routeInst = routes[routeId];

                        if (!routeInst.stops) {
                            routeInst.stops = {};
                        }

                        if (!routeInst.stops[stop.locid]) {
                            routeInst.stops[stop.locid] = stop;
                        }

                        if (!routeInst.directions) {
                            routeInst.directions = {};
                        }

                        if (!routeInst.directions[route.dir[0].dir]) {
                            routeInst.directions[route.dir[0].dir] = route.dir[0];
                        }

                    }

                    _.forEach(locations, function (stop) {
                        _.forEach(stop.route, function (route) {
                            placeRoute(route, stop);
                        });
                    });
                    return routes;
                }

                self.nearbyRoutes = createNearbyRouteDictionary(locations);
                return data;
            }

            function createStopMarkersForNearbyStops(data) {
                var locations = data.resultSet.location;

                _.forEach(locations, function (stop) {
                    stop.enabled = true;
                    stop.selected = false;
                    var stopMarker = StopData.createStopMarker(stop);
                    StopData.addMarkerToNearbyMarkers(stopMarker, stop);
                    StopData.memoizeIndividualStopMarker(stopMarker, stop);
                });

                return data;
            }

            function displayNearbyRouteLines(data) {
                _.forEach(self.nearbyRoutes, function (route) {
                    route.enabled = true;
                    route.selected = false;
                    _.forEach(route.directions, function (direction) {
                        var directionId = direction.dir;
                        RouteData.initRouteLineDisplay(route.routeId, directionId);
                    });
                });
                console.log('Route Lines Displayed: ' + RouteData.routesDisplayed);
                return data;
            }

            return trimet.getStopsAroundLocation(latitude, longitude, radiusInFeet)
                .then(storeRetrievedRoutes)
                .then(storeRetrievedStops)
                .then(initializeModel)
                .then(provideListOfNearbyStops)
                .then(provideListOfNearbyRoutes)
                .then(createStopMarkersForNearbyStops)
                .then(RouteData.retrieveRouteGeoJson)
                .then(displayNearbyRouteLines)
                .then(function setScopeVariables() {
                    return {
                        nearbyStops: self.nearbyStops,
                        nearbyRoutes: self.nearbyRoutes
                    };
                });
        };

        self.toggleNearbyRoute = function (route) {
            var nearbyRouteInst;

            function enableRoute(routeInst) {
                var directionId;
                _.forEach(routeInst.directions, function (direction) {
                    directionId = direction.dir;
                    RouteData.showRouteLayer(route.routeId, directionId);
                    self.nearbyRoutes[route.routeId].enabled = true;
                    self.nearbyRoutes[route.routeId].directions[directionId].enabled = true;
                });
            }

            function disableRoute(routeInst) {
                var directionId;
                _.forEach(routeInst.directions, function (direction) {
                    directionId = direction.dir;
                    RouteData.hideRouteLayer(route.routeId, directionId);
                    self.nearbyRoutes[route.routeId].enabled = false;
                    self.nearbyRoutes[route.routeId].directions[directionId].enabled = false;
                });
            }

            if (self.nearbyRoutes[route.routeId]) {
                nearbyRouteInst = self.nearbyRoutes[route.routeId];
                if (nearbyRouteInst.enabled === false) {
                    enableRoute(nearbyRouteInst);
                } else if (nearbyRouteInst.enabled === true) {
                    disableRoute(nearbyRouteInst);
                }
            }

            return {
                nearbyRoutes: self.nearbyRoutes
            };
        };

        self.findNearbyStopViewModel = function (stop) {
            return _.find(self.nearbyStops, {"locid": stop.locid});
        };

        self.deselectAllStops = function () {
            _.forEach(self.nearbyStops, function (stop) {
                stop.selected = false;
            });
        };

        self.toggleStopSelected = function (stop) {
            self.deselectAllStops();

            var stopInstance = self.findNearbyStopViewModel(stop);

            if (stopInstance.selected === true) {
                stopInstance.selected = false;
            } else if (stopInstance.selected === false) {
                stopInstance.selected = true;
            }

            return self.nearbyStops;
        };

    });
