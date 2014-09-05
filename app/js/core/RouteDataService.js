/**
 * Created by jamesonnyeholt2 on 9/4/14.
 */

angular.module('pdxStreetcarApp')

    .service('RouteData', function ($q, routeMapInstance, trimet, formatRetrievedRoutes, RouteColors) {
        var self = this;

        self.geoJsonRouteData = null;
        self.streetcarData = null;
        self.maxRailData = null;
        self.busRoutesData = null;

        self.routeLayers = {};
        self.stopMarkers = {};
        self.nearbyRoutes = {};
        self.routes = {};
        self.routesDisplayed = 0;

        self.retrieveRouteGeoJson = function () {
            var deferred = $q.defer();
            $.ajax({
                type: 'GET',
                url:'data/kml/tm_routes.kml'
            })
                .done(function(xml) {
                    var geoJson = toGeoJSON.kml(xml);
                    self.set(geoJson);
                    deferred.resolve(geoJson);
                });
            return deferred.promise;
        };

        self.set = function set(data) {
            self.geoJsonRouteData = data;
            return data;
        };

        self.clear = function clear() {
            self.geoJsonRouteData = null;
        };

        self.findFeature = function (routeId) {
            return _.forEach(self.geoJsonRouteData.features, function (route) {
                return parseInt(route.properties.route_number) === routeId;
            });
        };

        function compriseFeatureCollection (feature) {
            var featureCollection = {
                "type": "FeatureCollection",
                "features": []
            };
            featureCollection.features.push(feature);
            return featureCollection;
        }

        function determineRouteColor(routeId) {
            if (RouteColors[routeId]) {
                return RouteColors[routeId];
            } else {
                return RouteColors.BUS;
            }
        }

        function setRouteStyles() {
            routeMapInstance.map.data.setStyle(function(feature) {
                var routeId = feature.getProperty('route_number');
                var color = determineRouteColor(routeId);

                return {
                    strokeColor: '#' + color,
                    strokeWeight: 4
                };
            });
        }

        self.initRouteLineDisplay = function(routeId, directionId) {
            var featureCollection,
                layer;

            _.forEach(self.geoJsonRouteData.features, function (feature) {
                if (parseInt(feature.properties.route_number) === routeId) {
                    featureCollection = compriseFeatureCollection(feature);
                    layer = routeMapInstance.map.data.addGeoJson(featureCollection);
                    setRouteStyles();
                    var directionId = parseInt(feature.properties.direction);
                    self.memoizeRouteLayer(routeId, directionId, layer);
                    self.routesDisplayed += 1;
                }
            });
        };

        self.enableRoute = function (route) {
            if (!self.stopMarkers[route.routeId]) {
                self.stopMarkers[route.routeId] = {};
            }
            if (!self.stopMarkers[route.routeId][route.directionId]) {
                self.initRouteLineDisplay(route.routeId, route.directionId);
            }
            if (route.enabled === true) {
                route.enabled = false;
            } else if (route.enabled === false) {
                route.enabled = true;
            }
        };

        self.streetCar = function () {

            if (self.streetcarData) {
                return self.streetcarData;
            }

            return trimet.streetcar.getRoutes()
                .then(formatRetrievedRoutes)
                .then(function (result) {
                    self.streetcarData = result;
                    return result;
                });
        };

        self.bus = function () {

            if (self.busRoutesData) {
                return self.busRoutesData;
            }

            return trimet.bus.getRoutes()
                .then(formatRetrievedRoutes)
                .then(function (result) {
                    self.busRoutesData = result;
                    return result;
                });
        };

        self.trimet = function () {

            if (self.maxRailData) {
                return self.maxRailData;
            }

            return trimet.rail.getRoutes()
                .then(formatRetrievedRoutes)
                .then(function (result) {
                    self.maxRailData = result;
                    return result;
                });
        };

        // Nearby Routes

        self.clearNearbyRoutes = function () {
            if (!_.isEmpty(self.routeLayers)) {
                _.forEach(self.routeLayers, function (route, routeKey) {
                    _.forEach(route, function (directions, directionKey) {
                        self.clearRouteLayerOnMap(directions.layer[0]);
                        delete self.routeLayers[routeKey][directionKey];
                    });
                });
            }
            self.routeLayers = {};
        };

        self.memoizeRouteLayer = function (routeId, directionId, layer) {
            if (!self.routeLayers[routeId]) {
                self.routeLayers[routeId] = [];
            }
            self.routeLayers[routeId].push({
                enabled: true,
                directionId: directionId,
                layer: layer
            });
            return layer;
        };

        self.overwriteRouteLayerOnMap = function (routeId, directionId) {
            var layer,
                featureCollection;

            _.forEach(self.geoJsonRouteData.features, function (route) {
                if (parseInt(route.properties.route_number) === routeId) {
                    featureCollection = route;
                    layer = routeMapInstance.map.data.addGeoJson(featureCollection);
                    self.memoizeRouteLayer(routeId, directionId, layer);
                }
            });
        };

        self.clearRouteLayerOnMap = function (layer) {
            return routeMapInstance.map.data.remove(layer);
        };

        self.clearRouteLayersOnMap = function (routeId, directionId) {
            _.forEach(self.routeLayers[routeId], function (direction) {
                if (direction.directionId === directionId) {
                    self.clearRouteLayerOnMap(direction.layer[0]);
                }
            });
        };

        self.reconcileAlreadyEnabledRoutes = function (source, routes) {

            function checkIfRouteLayerIsEnabled(route, routeId) {
                var routeLayerInstance = self.routeLayers[routeId];

                function enableRouteOnList(directionId) {
                    _.forEach(route.directions, function (direction) {
                        if (direction.directionId === directionId) {
                            direction.enabled = true;
                        }
                    });
                }

                if (routeLayerInstance) {
                    _.forEach(routeLayerInstance, function (direction) {
                        if (direction.enabled === true) {
                            enableRouteOnList(direction.directionId);
                        }
                    });
                }
            }

            _.forEach(routes, function (route, routeId) {
                checkIfRouteLayerIsEnabled(route, routeId);
            });

            return routes;
        };

    });
