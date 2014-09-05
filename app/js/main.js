'use strict';

angular.module('pdxStreetcarApp')

    .service('routeMapInstance', function ($q) {
        var self = this;

        self.map = null;

        self.set = function (map) {
            self.map = map;
            return map;
        };

        self.get = function () {
            return self.map;
        };

        self.clear = function () {
            self.map = null;
        };

        self.init = function () {
            var deferred = $q.defer();

            var latLng,
                mapOptions,
                map;

            function setMap() {
                latLng = new google.maps.LatLng(45.5200, -122.6819);
                mapOptions = {
                    center: latLng,
                    zoom: 10,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    styles: [
                        {featureType: "administrative", stylers: [
                            {visibility: "on"}
                        ]},
                        {featureType: "poi", stylers: [
                            {visibility: "simplified"}
                        ]},
                        {featureType: "road", elementType: "labels", stylers: [
                            {visibility: "simplified"}
                        ]},
                        {featureType: "water", stylers: [
                            {visibility: "simplified"}
                        ]},
                        {featureType: "transit", stylers: [
                            {visibility: "simplified"}
                        ]},
                        {featureType: "landscape", stylers: [
                            {visibility: "simplified"}
                        ]},
                        {featureType: "road.highway", stylers: [
                            {visibility: "off"}
                        ]},
                        {featureType: "road.local", stylers: [
                            {visibility: "on"}
                        ]},
                        {featureType: "road.highway", elementType: "geometry", stylers: [
                            {visibility: "on"}
                        ]},
                        {featureType: "water", stylers: [
                            {color: "#84afa3"},
                            {lightness: 52}
                        ]},
                        {stylers: [
                            {saturation: -17},
                            {gamma: 0.36}
                        ]},
                        {featureType: "transit.line", elementType: "geometry", stylers: [
                            {color: "#3f518c"}
                        ]}
                    ]
                };
                if (self.map) {
                    self.clear();
                }
                map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
                if (map) {
                    self.set(map);
                    deferred.resolve(map);
                }
            }

            setMap();

            return deferred.promise;
        };
    })

    .service('mapLayers', function (routeMapInstance) {
        var self = this,
            trimetBoundaryLayer,
            trimetTransitCenterLayer,
            trimetParkAndRidesLayer,
            showParkAndRidesLayer = false,
            showTransitCenterLayer = false,
            showBoundaryLayer = false;

        self.load = function load() {
            trimetBoundaryLayer = new google.maps.KmlLayer({
                url: 'http://developer.trimet.org/gis/data/tm_boundary.kml'
            });
            trimetTransitCenterLayer = new google.maps.KmlLayer({
                url: 'http://developer.trimet.org/gis/data/tm_tran_cen.kml'
            });
            trimetParkAndRidesLayer = new google.maps.KmlLayer({
                url: 'http://developer.trimet.org/gis/data/tm_parkride.kml'
            });
        };

        self.toggleServiceBoundaryLayer = function () {
            if (!showTransitCenterLayer) {
                showTransitCenterLayer = true;
                trimetBoundaryLayer.setMap(routeMapInstance.map);
            } else {
                showTransitCenterLayer = false;
                trimetBoundaryLayer.setMap(null);
            }
        };

        self.toggleParkAndRidesLayer = function () {
            if (!showParkAndRidesLayer) {
                showParkAndRidesLayer = true;
                trimetParkAndRidesLayer.setMap(routeMapInstance.map);
            } else {
                showParkAndRidesLayer = false;
                trimetParkAndRidesLayer.setMap(null);
            }
        };

        self.toggleTransitCenterLayer = function () {
            if (!showBoundaryLayer) {
                showBoundaryLayer = true;
                trimetTransitCenterLayer.setMap(routeMapInstance.map);
            } else {
                showBoundaryLayer = false;
                trimetTransitCenterLayer.setMap(null);
            }
        };
    })

    .service('userLocation', function () {
        var self = this;

        self.marker = null;

        self.set = function (marker) {
            self.marker = marker;
        };
    })

    .service('previouslyOpenedInfoWindow', function () {
        var self = this;

        self.instance = null;

        self.set = function set(instance) {
            self.instance = instance;
        };
    })


    .service('ArrivalData', function (trimet, timeCalcService) {
        var self = this;

        self.getArrivalsForStop = function (stopMarker) {
            return trimet.getArrivalsForStop(stopMarker.stopMetaData.locid)
                .then(function (data) {
                    return timeCalcService.calculateRelativeTimes(data, data.resultSet.queryTime);
                });
        };
    })

    .service('RouteData', function ($q, routeMapInstance, trimet, formatRetrievedRoutes) {
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

        function addStylingToFeature(feature) {
            feature.style = {
                'strokeWeight': 20,
                'strokeColor': 'red'
            };

            return feature;
        }

        self.initRouteLineDisplay = function(routeId, directionId) {
            var featureCollection,
                layer;

            _.forEach(self.geoJsonRouteData.features, function (feature) {
                if (parseInt(feature.properties.route_number) === routeId) {
                    // styling would be added as a part of the feature here
                    feature = addStylingToFeature(feature);
                    featureCollection = compriseFeatureCollection(feature);
                    layer = routeMapInstance.map.data.addGeoJson(featureCollection);
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
            return trimet.streetcar.getRoutes()
                .then(formatRetrievedRoutes)
                .then(function (result) {
                    self.streetcarData = result;
                    return result;
                });
        };

        self.bus = function () {
            return trimet.bus.getRoutes()
                .then(formatRetrievedRoutes)
                .then(function (result) {
                    self.busRoutesData = result;
                    return result;
                });
        };

        self.trimet = function () {
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

    })

    .service('StopData', function ($q, $rootScope, trimet, routeMapInstance, RouteColors, RouteData, timeCalcService, userLocation, previouslyOpenedInfoWindow, ArrivalData) {
        var self = this;

        self.nearbyStopMarkers = {};
        self.stopMarkers = {};

        self.broadcastArrivalInfo = function (arrivalInfo) {
            $rootScope.$broadcast("arrivalInformation", arrivalInfo);
        };

        self.showArrivalsForStop = function showArrivalsForStop(stopMarker) {
            return ArrivalData.getArrivalsForStop(stopMarker)
                .then(function (arrivalInfo) {
                    self.broadcastArrivalInfo(arrivalInfo);
                });
        };

        self.createStopMarker = function createStopMarker (stop) {
            var stopId = stop.locid,
                latitude =  stop.lat,
                longitude = stop.lng,
                pinColor = RouteColors[stopId],
                pinImage,
                pinShadow,
                stopLatLng,
                stopMarker,
                infoWindow,
                infoWindowContent;

            if (!pinColor) {
                pinColor = RouteColors['default'];
            }

            pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
                    new google.maps.Size(21, 34),
                    new google.maps.Point(0, 0),
                    new google.maps.Point(10, 34));

            pinShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
                new google.maps.Size(40, 37),
                new google.maps.Point(0, 0),
                new google.maps.Point(12, 35));

            stopLatLng = new google.maps.LatLng(latitude, longitude);

            stopMarker = new google.maps.Marker({
                map: routeMapInstance.map,
                position: stopLatLng,
                icon: pinImage,
                shadow: pinShadow,
                animation: google.maps.Animation.DROP,
                clickable: true,
                stopMetaData: stop,
                title: stop.desc + ":" + stop.dir
            });

            infoWindow = new google.maps.InfoWindow();

            infoWindowContent = stop.desc +
                ": " +
                stop.dir;

            // TODO: Provide function callback in separate resusable service function
            google.maps.event.addListener(stopMarker, 'click', function () {
                if (previouslyOpenedInfoWindow.instance) {
                    previouslyOpenedInfoWindow.instance.close();
                }
                infoWindow.setContent(infoWindowContent);
                infoWindow.open(routeMapInstance.map, this);
                routeMapInstance.map.panTo(this.position);
                routeMapInstance.map.setZoom(17);
                previouslyOpenedInfoWindow.set(infoWindow);

                self.showArrivalsForStop(stopMarker);
            });

            return stopMarker;
        };

        self.createStopMarkers = function (routeId, directionId, stops) {
            _.forEach(stops, function (stop) {
                location.enabled = true;
                self.createStopMarker(stop);
            });

            return stops;
        };

        self.addMarkerToNearbyMarkers = function (stopMarker, stop) {
            var nearbyStops = self.nearbyStopMarkers;

            if (!nearbyStops[stop.locid]) {
                nearbyStops[stop.locid] = stopMarker;
            }

            return nearbyStops;
        };

        self.clearNearbyStopMarkers = function () {
            if (!_.isEmpty(self.nearbyStopMarkers)) {
                _.forEach(self.nearbyStopMarkers, function (marker) {
                    marker.setMap(null);
                });
            }
            self.nearbyStopMarkers = {};
        };

        self.clearStopMarkers = function () {
            if (!_.isEmpty(self.stopMarkers)) {
                _.forEach(self.stopMarkers, function (marker) {
                    marker.setMap(null);
                });
            }
            self.stopMarkers = {};
        };

        self.memoizeIndividualStopMarker = function (stopMarker, stop) {
            var stops = self.stopMarkers;

            if (!stops[stop.locid]) {
                stops[stop.locid] = stopMarker;
            }

            return stops;
        };

        self.memoizeRouteStopMarkers = function () {

        };

        self.enableStopMarkers = function (routeId, directionId, stops) {
            _.forEach(stops, function (stop) {
                location.enabled = true;
                var stopMarker = self.createStopMarker(stop);
                self.memoizeIndividualStopMarker(stopMarker, stop);
            });
            return stops;
        };

        self.findMemoizedStopMarkerInstance = function (locationId) {
            var stopMarkerInstance;

            if (self.stopMarkers[locationId]) {
                stopMarkerInstance = self.stopMarkers[locationId];
            }

            return stopMarkerInstance;
        };

        self.selectStopMarker = function (stop) {
            var marker = self.findMemoizedStopMarkerInstance(stop.locid);

            if (marker) {
                google.maps.event.trigger(marker, 'click');
            }
        };
    })

    .service('NearbyService', function (StopData, RouteData, trimet, RouteColors, routeMapInstance, feetToMeters, userLocation) {
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

    })

    .service('Navigator', function (RouteData) {
        var self = this;

        self.toggleRoute = function (target, route) {

            var routeId = route.routeId,
                directionId = route.directionId,
                routes;

            function retrieveRoutesData(target) {
                if (target === 'streetcar') {
                    routes = RouteData.streetcarData;
                } else if (target === 'trimet') {
                    routes = RouteData.maxRailData;
                } else if (target === 'bus') {
                    routes = RouteData.busRoutesData;
                }
                return routes;
            }

            function syncRoutesData(data, target) {
                if (target === 'streetcar') {
                    RouteData.streetcarData = data;
                } else if (target === 'trimet') {
                    RouteData.maxRailData = data;
                } else if (target === 'bus') {
                    RouteData.busRoutesData = data;
                }
            }

            function setRouteDisabled(routeId, direction) {
                routes[routeId].enabled = false;
                direction.enabled = false;
            }

            function setRouteEnabled(routeId, direction) {
                routes[routeId].enabled = true;
                direction.enabled = true;
            }

            function findDirection(id, directions) {
                return _.find(directions, {'directionId': id});
            }

            function toggleRoute(foundRoute) {
                var direction = findDirection(directionId, foundRoute.directions);

                if (direction.enabled === false) {
                    RouteData.overwriteRouteLayerOnMap(routeId, direction.directionId);
                    setRouteEnabled(routeId, direction);
                } else if (direction.enabled === true) {
                    RouteData.clearRouteLayersOnMap(routeId, direction.directionId);
                    setRouteDisabled(routeId, direction);
                }
            }

            function findRoute(routes) {
                return _.find(routes, {"routeId": routeId});
            }

            routes = retrieveRoutesData(target);

            var foundRoute = findRoute(routes);

            toggleRoute(foundRoute);

            syncRoutesData(routes, target);

            return routes;
        };
    });



