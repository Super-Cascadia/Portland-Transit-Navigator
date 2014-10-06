/**
 * Created by jamesonnyeholt2 on 9/4/14.
 */

angular.module('pdxStreetcarApp')

    .service('RouteData', function ($q, $log, $rootScope, routeMapInstance, trimet, formatRetrievedRoutes, RouteColors) {

        'use strict';

        var self = this;

        self.geoJsonRouteData = null;
        self.streetcarData = null;
        self.maxRailData = null;
        self.busRoutesData = null;
        self.selectedRoute = null;

        self.routeLayers = {};
        self.stopMarkers = {};
        self.nearbyRoutes = {};
        self.routes = {};
        self.routesDisplayed = 0;
        self.selectedRouteStop = null;

        self.retrieveRouteGeoJson = function retrieveRouteGeoJson() {
            var deferred = $q.defer();

            if (self.geoJsonRouteData) {
                deferred.resolve(self.geoJsonRouteData);
            }

            $.ajax({
                type: 'GET',
                url: 'data/kml/tm_routes.kml'
            })
                .done(function (xml) {
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

        self.findFeature = function findFeature(routeId) {
            return _.forEach(self.geoJsonRouteData.features, function (route) {
                return parseInt(route.properties.route_number) === routeId;
            });
        };

        self.memoizeStopDataOnRoute = function memoizeStopData(route) {

            function findStopsForDirection(directionId) {
                var stops;
                _.forEach(route.dir, function (direction) {
                    if (direction.dir === directionId) {
                        stops = direction.stop;
                    }
                });
                return stops;
            }

            function convertStopsArrayToDictionary(stops) {
                var stopsDictionary = {};
                _.forEach(stops, function (stop) {
                    if (!stopsDictionary[stop.locid]) {
                        stop.selected = false;
                        stopsDictionary[stop.locid] = stop;
                    }
                });

                return stopsDictionary;
            }

            var routeId = route.route;

            if (self.routes[routeId] && self.routes[routeId].directions) {
                _.forEach(self.routes[routeId].directions, function (direction) {
                    if (!self.routes[routeId].directions.stops) {
                        var stops = findStopsForDirection(direction.dir);
                        if (stops) {
                            direction.stop = convertStopsArrayToDictionary(stops);
                        }
                    }
                });
            }

            return self.routes[routeId];
        };

        function cleanResultSet(data) {
            return data.resultSet.route[0];
        }

        function convertStopArrToDict(stopsArray) {
            var stops = {};

            _.forEach(stopsArray, function (stop) {
                if (!stops[stop.locid]) {
                    stops[stop.locid] = stop;
                }
            });

            return stops;
        }

        function convertDirectionsArrToDict(directionArray) {
            var directions = {};

            _.forEach(directionArray, function (direction) {
                if (!directions[direction.dir]) {
                    directions[direction.dir] = direction;
                }
            });

            return directions;
        }

        function normalizeRoutePropertyNames(route) {
            if (route.dir) {
                route.directions = convertDirectionsArrToDict(route.dir);
                delete route.dir;
            }
            if (route.directions) {
                _.forEach(route.directions, function (direction) {
                    if (direction.stop) {
                        direction.stops = convertStopArrToDict(direction.stop);
                        delete direction.stop;
                    }
                });
            }
            return route;
        }

        self.memoizeRoute = function (route) {
            var routeId = route.route;
            self.routes[routeId] = route;
            return route;
        };

        self.getRouteData = function (routeId) {
            // TODO: make sure that routes and nearbyRoutes have data in them at this point
            return trimet.getRouteById(routeId)
                .then(cleanResultSet)
                .then(normalizeRoutePropertyNames)
                .then(self.memoizeRoute)
                .then(self.memoizeStopDataOnRoute)
                .then(function (data) {
                    self.selectedRoute = self.routes[routeId];
                    return self.selectedRoute;
                });
        };

        self.selectRouteStop = function (stop) {
            if (stop.locid && self.selectedRoute.directions) {
                _.forEach(self.selectedRoute.directions, function (direction) {
                    if (direction.stops[stop.locid]) {
                        direction.stops[stop.locid].selected = false;
                    }
                });

                _.forEach(self.selectedRoute.directions, function (direction) {
                    if (direction.stops[stop.locid]) {
                        direction.stops[stop.locid].selected = true;
                        self.selectedRouteStop = stop;
                        return;
                    }
                });
            } else {
                $log.error('self.selectedRouteStop is not available.');
            }

            return self.selectedRoute;
        };

        self.memoizeNearbyRoutes = function (data) {
            _.forEach(data.resultSet.location, function (stop) {
                _.forEach(stop.route, function (route) {
                    if (!self.routes[route.route]) {
                        self.routes[route.route] = route;
                    }
                });
            });
        };

        function compriseFeatureCollection(feature) {
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

        function zoomMapToFitRoute(routeId) {
            function processPoints(geometry, callback, thisArg) {
                if (geometry instanceof google.maps.LatLng) {
                    callback.call(thisArg, geometry);
                } else if (geometry instanceof google.maps.Data.Point) {
                    callback.call(thisArg, geometry.get());
                } else {
                    geometry.getArray().forEach(function(g) {
                        processPoints(g, callback, thisArg);
                    });
                }
            }

            var bounds = new google.maps.LatLngBounds();
            routeMapInstance.map.data.forEach(function(feature) {
                if (feature.k.route_number && parseInt(feature.k.route_number) === routeId) {
                    processPoints(feature.getGeometry(), bounds.extend, bounds);
                }
            });
            routeMapInstance.map.fitBounds(bounds);
        }

        self.routeSelectedOnMap = function (routeNumber) {
            $rootScope.$broadcast('routeSelectedFromMap', routeNumber);
        };

        self.routeHoveredOnMap = function (routeNumber) {
            $rootScope.$broadcast('routeHoveredFromMap', routeNumber);
        };

        self.initRouteLineDisplay = function (routeId, directionId) {
            var featureCollection,
                layer;

            function setRouteMouseOverEvent() {
                routeMapInstance.map.data.addListener('mouseover', function (event) {
                    routeMapInstance.map.data.revertStyle();
                    routeMapInstance.map.data.overrideStyle(event.feature, {strokeWeight: 8});
                    var routeNumber = event.feature.getProperty('route_number');
                    self.routeHoveredOnMap(routeNumber);
                });
            }

            function setRouteMouseOutEvent() {
                routeMapInstance.map.data.addListener('mouseout', function (event) {
                    routeMapInstance.map.data.revertStyle();
                });
            }

            function setRouteClickEvent() {
                routeMapInstance.map.data.addListener('click', function (event) {
                    var routeNumber;
                    if (event.alreadyCalled_) {
                        $log.warn('Route click event was already called.');
                    } else {
                        if (event.feature.k && event.feature.k.route_number) {
                            var routeId = parseInt(event.feature.k.route_number);
                            zoomMapToFitRoute(routeId);
                        }
                        routeNumber = event.feature.getProperty('route_number');
                        routeMapInstance.map.data.revertStyle();
                        routeMapInstance.map.data.overrideStyle(event.feature, {
                            strokeWeight: 8
                        });
                        self.routeSelectedOnMap(routeNumber);
                        event.alreadyCalled_ = true;
                    }
                });
            }

            function setRouteStyles() {
                routeMapInstance.map.data.setStyle(function (feature) {
                    var routeId = feature.getProperty('route_number');
                    var color = determineRouteColor(routeId);

                    return {
                        strokeColor: '#' + color,
                        strokeWeight: 4
                    };
                });
            }

            _.forEach(self.geoJsonRouteData.features, function (feature) {
                if (parseInt(feature.properties.route_number) === routeId) {
                    if (parseInt(feature.properties.direction) === directionId) {
                        featureCollection = compriseFeatureCollection(feature);
                        layer = routeMapInstance.map.data.addGeoJson(featureCollection);
                        setRouteStyles();
                        setRouteMouseOverEvent();
                        setRouteMouseOutEvent();
                        setRouteClickEvent();
                        self.memoizeRouteLayer(routeId, layer, feature);
                    }
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

            var defer = $q.defer();

            if (self.streetcarData) {
                defer.resolve(self.streetcarData);
            }

            return trimet.streetcar.getRoutes()
                .then(formatRetrievedRoutes)
                .then(function (result) {
                    self.streetcarData = result;
                    return result;
                });
        };

        self.bus = function () {

            var defer = $q.defer();

            if (self.busRoutesData) {
                defer.resolve(self.busRoutesData);
            }

            return trimet.bus.getRoutes()
                .then(formatRetrievedRoutes)
                .then(function (result) {
                    self.busRoutesData = result;
                    return result;
                });
        };

        self.trimet = function () {

            var defer = $q.defer();

            if (self.maxRailData) {
                defer.resolve(self.maxRailData);
            }

            return trimet.rail.getRoutes()
                .then(formatRetrievedRoutes)
                .then(function (result) {
                    self.maxRailData = result;
                    return result;
                });
        };

        self.selectRoute = function (route) {
            function checkIfRouteIsMemoized(route) {
                return self.routeLayers[route.routeId];
            }

            if (!checkIfRouteIsMemoized(route)) {
                self.initRouteLineDisplay(route.routeId);
            }
            zoomMapToFitRoute(route.routeId);
            self.routeSelectedOnMap(route.routeId);
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

        self.memoizeRouteLayer = function (routeId, layer, feature) {
            var directionId = parseInt(feature.properties.direction);
            var frequent = feature.properties.frequent;

            if (!self.routeLayers[routeId]) {
                self.routeLayers[routeId] = {
                    standard: {},
                    frequent: {}
                };
            }

            if (frequent == 'True') {
                self.routeLayers[routeId].frequent[directionId] = {
                    enabled: true,
                    directionId: directionId,
                    layer: layer,
                    feature: feature
                };
            } else if (frequent == 'False') {
                self.routeLayers[routeId].standard[directionId] = {
                    enabled: true,
                    directionId: directionId,
                    layer: layer,
                    feature: feature
                };
            }

            return layer;
        };

        function routeIsMemoized(routeId, directionId) {
            return self.routeLayers[routeId] &&
                (self.routeLayers[routeId].standard[directionId] || self.routeLayers[routeId].frequent[directionId]);
        }

        self.showRouteLayer = function (routeId, directionId) {

            function addRouteLayerToMap(featureCollection) {
                return routeMapInstance.map.data.addGeoJson(featureCollection);
            }

            function enableMemoizedRoute(routeId, directionId) {
                var layer,
                    route,
                    direction,
                    featureCollection;

                function enableRouteFeature(direction) {
                    featureCollection = compriseFeatureCollection(direction.feature);
                    layer = addRouteLayerToMap(featureCollection);
                    self.memoizeRouteLayer(routeId, layer, direction.feature);
                    direction.enabled = false;
                }

                if (self.routeLayers[routeId]) {
                    route = self.routeLayers[routeId];
                    if (route.frequent && route.frequent[directionId]) {
                        direction = route.frequent[directionId];
                        enableRouteFeature(direction);
                    }
                    if (route.standard && route.standard[directionId]) {
                        direction = route.standard[directionId];
                        enableRouteFeature(direction);
                    }
                }
            }

            function enableNewRoute (routeId, directionId) {
                var layer;

                _.forEach(self.geoJsonRouteData.features, function (feature) {
                    if (parseInt(feature.properties.route_number) === routeId) {
                        if (parseInt(feature.properties.direction) === directionId) {
                            layer = addRouteLayerToMap(feature);
                            self.memoizeRouteLayer(routeId, layer, feature);
                        }
                    }
                });
            }

            if (routeIsMemoized(routeId, directionId)) {
                enableMemoizedRoute(routeId, directionId);
            } else {
                enableNewRoute(routeId, directionId);
            }
        };

        self.hideRouteLayer = function (routeId, directionId) {

            function clearRouteLayersOnMap(routeId, directionId) {
                var direction,
                    route;

                function clearRouteLayer(layer) {
                    return routeMapInstance.map.data.remove(layer);
                }

                if (self.routeLayers[routeId]) {
                    route = self.routeLayers[routeId];
                    if (route.frequent && route.frequent[directionId]) {
                        direction = route.frequent[directionId];
                        clearRouteLayer(direction.layer[0]);
                        direction.enabled = false;
                    }
                    if (route.standard && route.standard[directionId]) {
                        direction = route.standard[directionId];
                        clearRouteLayer(direction.layer[0]);
                        direction.enabled = false;
                    }
                }
            }

            if (routeIsMemoized(routeId, directionId)) {
                clearRouteLayersOnMap(routeId, directionId);
            } else {
                $log.error('Route ' + routeId + ' could not be found in model.  An error occurred.');
            }
        };

        self.reconcileAlreadyEnabledRoutes = function (source, routes) {

            function checkIfRouteLayerIsEnabled(route, routeId) {
                var routeLayerInstance = self.routeLayers[routeId];

                function syncToRouteList(direction) {
                    route.directions[direction.directionId].enabled = direction.enabled;
                }

                if (routeLayerInstance) {
                    _.forEach(routeLayerInstance.standard, function (direction) {
                        syncToRouteList(direction);
                    });
                    _.forEach(routeLayerInstance.frequent, function (direction) {
                        syncToRouteList(direction);
                    });
                }
            }

            _.forEach(routes, function (route, routeId) {
                checkIfRouteLayerIsEnabled(route, routeId);
            });

            return routes;
        };

    });
