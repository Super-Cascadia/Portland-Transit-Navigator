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
                        if (!routes[route.route]) {
                            routes[route.route] = route;
                            routes[route.route].stops = {};
                        }
                        if (!routes[route.route].stops) {
                            routes[route.route].stops = {};
                        }
                        if (!routes[route.route].stops[stop.locid]) {
                            routes[route.route].stops[stop.locid] = stop;
                        }
                        if (routes[route.route].dir[0].dir !== route.dir[0].dir) {
                            routes[route.route].dir.push(route.dir[0]);
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
                    var routeId = route.route;
                    RouteData.initRouteLineDisplay(routeId);
                });
                console.log("Route Lines Displayed: " + RouteData.routesDisplayed);
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
            var routeId = route.route,
                directionId;

            function setRouteDisabled(routeId, directionId) {
                self.nearbyRoutes[routeId].enabled = false;
                self.nearbyRoutes[routeId].dir[directionId].enabled = false;
            }

            function setRouteEnabled(routeId, directionId) {
                self.nearbyRoutes[routeId].enabled = true;
                self.nearbyRoutes[routeId].dir[directionId].enabled = true;
            }

            _.forEach(self.nearbyRoutes, function (route) {
                if (route.route === routeId) {
                    if (route.enabled === false) {
                        _.forEach(route.dir, function (direction) {
                            directionId = direction.dir;
                            RouteData.overwriteRouteLayerOnMap(routeId, directionId);
                            setRouteEnabled(routeId, directionId);
                        });
                    } else if (route.enabled === true) {
                        _.forEach(route.dir, function (direction) {
                            directionId = direction.dir;
                            RouteData.clearRouteLayersOnMap(routeId, directionId);
                            setRouteDisabled(routeId, directionId);
                        });
                    }
                }
            });

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

        self.setRouteSelected = function (route) {

        };

    });
