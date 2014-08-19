'use strict';
angular.module('pdxStreetcarApp')

    .constant('RouteColors', {
        "193": "89C831",
        "194": "00A9CE",
        "100": "0062A9",
        "200": "008850",
        "90": "D30E41",
        "190": "FFC500",
        "default": "ADD8E6"
    })

    .constant('distanceConversions', {
        FEET_TO_METERS: 0.3048
    })


    .factory('feetToMeters', function (distanceConversions) {
        "use strict";
        return function (feet) {
            return feet * distanceConversions.FEET_TO_METERS;
        };
    })

    .factory('timeCalcService', function ($q, $log) {
        // Variables
        var streetCarOperatingHours;

        // Utility Functions
        function getNewDate(hour, minute) {
            var constructedDate;
            constructedDate = moment();
            constructedDate.hours(hour);
            constructedDate.minutes(minute);
            return constructedDate;
        }

        streetCarOperatingHours = [
            {
                name: 'sunday',
                daysOfWeek: [0],
                startTime: getNewDate(7, 30),
                endTime: getNewDate(23, 30)
            },
            {
                name: 'weekdays',
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: getNewDate(5, 30),
                endTime: getNewDate(23, 30)
            },
            {
                name: 'saturday',
                daysOfWeek: [6],
                startTime: getNewDate(7, 30),
                endTime: getNewDate(23, 30)
            }

        ];

        // Service logic
        function getTimeDifference(earlierDate, laterDate) {
            var deferred = $q.defer(),
                nTotalDiff = laterDate.getTime() - earlierDate.getTime(),
                oDiff = new Object();
            oDiff.days = Math.floor(nTotalDiff / 1000 / 60 / 60 / 24);
            nTotalDiff -= oDiff.days * 1000 * 60 * 60 * 24;
            oDiff.hours = Math.floor(nTotalDiff / 1000 / 60 / 60);
            nTotalDiff -= oDiff.hours * 1000 * 60 * 60;
            oDiff.minutes = Math.floor(nTotalDiff / 1000 / 60);
            nTotalDiff -= oDiff.minutes * 1000 * 60;
            oDiff.seconds = Math.floor(nTotalDiff / 1000);
            if (oDiff) {
                deferred.resolve(oDiff);
            } else {
                deferred.reject();
            }
            return deferred.promise;
        }

        function calculateDifferenceInTimes(arrival, queryTime) {
            var estimatedArrivalTime,
                deferred = $q.defer(),
                queryTimeDateObject;
            if (arrival.estimated) {
                estimatedArrivalTime = new Date(arrival.estimated);
            } else {
                estimatedArrivalTime = new Date(arrival.scheduled);
            }
            queryTimeDateObject = new Date(queryTime);
            getTimeDifference(queryTimeDateObject, estimatedArrivalTime)
                .then(function (diff) {
                    deferred.resolve(diff);
                }, function () {
                    deferred.reject();
                });
            return deferred.promise;
        }

        function sortArrivalsArrayByDate(arrivals) {
            arrivals.sort(function (a, b) {
                var keyA = new Date(a.estimated),
                    keyB = new Date(b.estimated);
                if (keyA < keyB) {
                    return -1;
                }
                if (keyA > keyB) {
                    return 1;
                }
                return 0;
            });
            return arrivals;
        }

        function calculateRelativeTimes(arrivalInfo, queryTime) {
            var deferred = $q.defer(),
                arrivals = arrivalInfo.resultSet.arrival;
            arrivals = sortArrivalsArrayByDate(arrivals);
            _.forEach(arrivals, function (currentArrival, index, array) {
                calculateDifferenceInTimes(currentArrival, queryTime)
                    .then(function (remainingTime) {
                        if (remainingTime.days < 1 && remainingTime.hours < 1) {
                            if (remainingTime.minutes <= 3) {
                                currentArrival.imminent = true;
                            } else if (remainingTime.minutes <= 6) {
                                currentArrival.soon = true;
                            } else if (remainingTime.minutes <= 15) {
                                currentArrival.enoughTimeForCoffee = true;
                            } else if (remainingTime.minutes >= 16) {
                                currentArrival.aGoodAmountofTime = true;
                            }
                        } else {
                            currentArrival.justWalk = true;
                        }
                        currentArrival.remainingTime = remainingTime;
                        if ((index + 1) === array.length) {
                            deferred.resolve(arrivalInfo);
                        }
                    }, function () {
                        $log.error("Could not calculate the difference in times.");
                        deferred.reject();
                    });
            });
            return deferred.promise;
        }

        function isStreetCarOutOfService() {
            var deferred = $q.defer(),
                currentDate,
                currentDay,
                operatingSchedule;
            currentDate = moment();
            currentDay = currentDate.day();

            function findScheduleForTodaysDate() {
                _.forEach(streetCarOperatingHours, function (schedule, index, array) {
                    return _.find(schedule.daysOfWeek, function (dayNumber) {
                        if (dayNumber === currentDay) {
                            operatingSchedule = schedule;
                            return operatingSchedule;
                        }
                    });
                });
            }

            function currentTimeAfterStartTime(differenceInTime) {
                if (differenceInTime > 0) {
                    return true;
                }
            }

            function currentTimeBeforeEndTime(differenceInTime) {
                if (differenceInTime < 0) {
                    return true;
                }
            }

            function determineIfCurrentTimeIsInRange() {
                var differenceToStartTime,
                    differenceToEndTime;
                differenceToStartTime = currentDate.diff(operatingSchedule.startTime, 'minutes');
                differenceToEndTime = currentDate.diff(operatingSchedule.endTime, 'minutes');
                if (currentTimeAfterStartTime(differenceToStartTime)) {
                    if (currentTimeBeforeEndTime(differenceToEndTime)) {
                        deferred.resolve(differenceToStartTime, differenceToEndTime);
                    }
                } else {
                    if (currentTimeBeforeEndTime(differenceToEndTime)) {
                        deferred.reject(differenceToStartTime, differenceToEndTime);
                    }
                }
            }

            findScheduleForTodaysDate();
            determineIfCurrentTimeIsInRange();
            return deferred.promise;
        }


        // Public API here
        return {
            calculateRelativeTimes: function (arrivalInfo, queryTime) {
                return calculateRelativeTimes(arrivalInfo, queryTime);
            },
            calculateDifferenceInTimes: function (arrival, queryTime) {
                return calculateDifferenceInTimes(arrival, queryTime);
            },
            isStreetCarOutOfService: function () {
                return isStreetCarOutOfService();
            }
        };
    })

    .factory('formatRetrievedRoutes', function () {
        "use strict";
        return function (data) {
            var result = {};
            _.forEach(data.resultSet.route, function (route) {
                var routeId = route.route;
                var template = {
                    name: route.desc,
                    detour: route.detour,
                    routeId: routeId,
                    type: route.type,
                    directions: []
                };
                if (route.dir && _.isArray(route.dir)) {
                    if (route.dir[0]) {
                        template.directions[0] = {
                            routeId: routeId,
                            directionId: route.dir[0].dir || 0,
                            stops: route.dir[0].stop || [],
                            displayName: route.dir[0].desc || route.desc,
                            enabled: false
                        };
                    }
                    if (route.dir[1]) {
                        template.directions[1] = {
                            routeId: routeId,
                            directionId: route.dir[1].dir || 1,
                            stops: route.dir[1].stop || [],
                            displayName: route.dir[1].desc || route.desc,
                            enabled: false
                        };
                    }
                }
                result[routeId] = template;
            });
            return result;
        };
    })

    .factory('trimetUtilities', function () {

        function isStreetCarRoute (arrival) {
            return _.contains([193, 194], arrival.route);
        }

        function isTrimetRoute (arrival) {
            return _.contains([100,200,90,190], arrival.route);
        }

        return {
            isStreetCarRoute: isStreetCarRoute,
            isTrimetRoute: isTrimetRoute
        };
    })


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


    .service('RouteData', function ($q, routeMapInstance, trimet, formatRetrievedRoutes) {
        var self = this;

        self.geoJsonRouteData = null;
        self.streetcarData = null;
        self.maxRailData = null;
        self.busRoutesData = null;
        self.routeLayers = {};
        self.stopMarkers = {};

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

        self.memoizeRouteLayer = function (routeId, directionId, layer) {
            if (!self.routeLayers[routeId]) {
                self.routeLayers[routeId] = {};
            }
            if (!self.routeLayers[routeId][directionId]) {
                self.routeLayers[routeId][directionId] = {
                    layer: layer,
                    enabled: true
                };
            }
            return layer;
        };

        self.overwriteRouteLayer = function (routeId, directionId, layer) {
            if (self.routeLayers[routeId][directionId]) {
                self.routeLayers[routeId][directionId] = {
                    layer: layer,
                    enabled: true
                };
            }
            return layer;
        };

        self.overwriteRouteLayerOnMap = function (routeId, directionId) {
            var layer,
                featureCollection;

            featureCollection = self.findFeature(routeId, directionId);
            layer = routeMapInstance.map.data.addGeoJson(featureCollection);
            self.overwriteRouteLayer(routeId, directionId, layer);
        };

        self.clearRoutelayerOnMap = function (layer) {
            return routeMapInstance.map.data.remove(layer);
        };

        self.clear = function clear() {
            self.geoJsonRouteData = null;
        };

        self.findFeature = function (routeId, directionId) {
            return _.find(self.geoJsonRouteData.features, function (route) {
                return parseInt(route.properties.route_number) === routeId && parseInt(route.properties.direction) === directionId;
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

        self.initRouteLineDisplay = function(routeId, directionId) {
            var featureCollection,
                layer;

            var feature = self.findFeature(routeId, directionId);
            featureCollection = compriseFeatureCollection(feature);
            layer = routeMapInstance.map.data.addGeoJson(featureCollection);
            self.memoizeRouteLayer(routeId, directionId, layer);
        };

        function toggleEnabledFlags(route) {
            function setAllMapMarkers(map, route, direction) {
                var stopMarkers = markers[route][direction];
                if (stopMarkers && _.isArray(stopMarkers)) {
                    _.forEach(stopMarkers, function (marker) {
                        marker.setMap(map);
                    });
                }
            }

            function hideRoute(route, direction) {
                setAllMapMarkers(null, route, direction);
            }

            function showRoute(route, direction) {
                setAllMapMarkers(routeMapInstance.map, route, direction);
            }

            if (route.enabled === true) {
                route.enabled = false;
                hideRoute(route.routeId, route.directionId);
            } else if (route.enabled === false) {
                route.enabled = true;
                showRoute(route.routeId, route.directionId);
            }
        }

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

            toggleEnabledFlags(route);
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

    .service('StopData', function ($q, trimet, routeMapInstance, RouteColors, RouteData, timeCalcService, userLocation, previouslyOpenedInfoWindow, ArrivalData) {
        var self = this;

        self.nearbyStopMarkers = {};

        self.showArrivalsForStop = function showArrivalsForStop(stopMarker) {
            return ArrivalData.getArrivalsForStop(stopMarker)
                .then(function (arrivalInfo) {
                    self.selectedStop = arrivalInfo;
                    self.remainingTime = arrivalInfo.resultSet.arrival[0].remainingTime;
                    self.arrivalInfo = arrivalInfo.resultSet.arrival[0];
                    self.stopIsSelected = true;
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
                title: stop.desc + ":" + stop.dir
            });

            infoWindow = new google.maps.InfoWindow();

            infoWindowContent = stop.desc +
                ": " +
                stop.dir;

            google.maps.event.addListener(stopMarker, 'click', function () {
                if (previouslyOpenedInfoWindow.instance) {
                    previouslyOpenedInfoWindow.close();
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

        self.createStopMarkers = function (stops) {
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

    })


    .service('NearbyService', function (StopData, RouteData, trimet, RouteColors, routeMapInstance, feetToMeters) {
        var self = this;

        self.nearbyStopMarkers = {};
        self.nearbyStops = null;
        self.nearbyRoutes = null;

        self.get = function get(latitude, longitude, distanceFromLocation) {
            var radiusInFeet = distanceFromLocation || 660,
                stopRadiusIndicator;

            function provideListOfNearbyStops(data) {
                var locations = data.resultSet.location;
                _.forEach(locations, function (stop) {
                    stop.enabled = true;
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

            function setRadiusAroundUser() {
                if (stopRadiusIndicator) {
                    stopRadiusIndicator.setMap(null);
                }

                stopRadiusIndicator = new google.maps.Circle({
                    map: routeMapInstance.map,
                    radius: feetToMeters(radiusInFeet),    // 10 miles in metres
                    strokeColor: '#AA0000',
                    fillColor: '#AA0000'
                });

                //                stopRadiusIndicator.bindTo('center', userLocation.marker, 'position');
            }

            function createStopMarkersForNearbyStops(data) {
                var locations = data.resultSet.location;

                _.forEach(locations, function (stop) {
                    stop.enabled = true;
                    var stopMarker = StopData.createStopMarker(stop);
                    StopData.addMarkerToNearbyMarkers(stopMarker, stop);
                });
                return data;
            }

            function displayNearbyRouteLines(data) {
                function showRouteLine(routeId, directionId) {
                    RouteData.initRouteLineDisplay(routeId, directionId);
                    self.nearbyRoutes[routeId].enabled = true;
                    self.nearbyRoutes[routeId].dir[directionId].enabled = true;
                }
                _.forEach(self.nearbyRoutes, function (route) {
                    _.forEach(route.dir, function (direction) {
                        showRouteLine(route.route, direction.dir);
                    });
                });
                return data;
            }

            setRadiusAroundUser();
            StopData.clearNearbyStopMarkers();

            return trimet.getStopsAroundLocation(latitude, longitude, radiusInFeet)
                .then(provideListOfNearbyStops)
                .then(provideListOfNearbyRoutes)
                .then(createStopMarkersForNearbyStops)
                .then(RouteData.retrieveRouteGeoJson)
                .then(displayNearbyRouteLines)
                .then(function () {
                    return {
                        nearbyStops: self.nearbyStops,
                        nearbyRoutes: self.nearbyRoutes
                    };
                });
        };

    })

    .service('Navigator', function (RouteData, StopData) {
        var self = this;

        self.nearbyRoutes = null;

        function setRouteDisabled(routeId, directionId) {
            self.nearbyRoutes[routeId].enabled = false;
            self.nearbyRoutes[routeId].dir[directionId].enabled = false;
        }

        function setRouteEnabled(routeId, directionId) {
            self.nearbyRoutes[routeId].enabled = true;
            self.nearbyRoutes[routeId].dir[directionId].enabled = true;
        }

        self.toggleNearbyRoute = function (route) {
            var routeId = route.route,
                directionId;
            if (RouteData.routeLayers[routeId]) {
                var directions = RouteData.routeLayers[routeId];
                _.forEach(directions, function (direction, key) {
                    directionId = parseInt(key);
                    if (direction.enabled === false) {
                        direction.enabled = true;
                        setRouteEnabled(routeId, directionId);
                        RouteData.overwriteRouteLayerOnMap(routeId, directionId);
                    } else if (direction.enabled === true) {
                        direction.enabled = false;
                        setRouteDisabled(routeId, directionId);
                        RouteData.clearRoutelayerOnMap(direction.layer[0]);
                    }
                });
            }
            return {

            };
        };

        self.toggleRoute = function (route) {
            RouteData.enableRoute(route);
            StopData.createStopMarkers(route.routeId, route.directionId, route.stops);
        };
    })


    .controller('RouteMapCtrl', function ($scope, $log, $q, $http, trimet, RouteColors, $timeout, feetToMeters, timeCalcService, formatRetrievedRoutes, trimetUtilities, routeMapInstance, RouteData, userLocation, mapLayers, Navigator, NearbyService) {
        'use strict';
        var self = this,
            map;

        self.stopIsSelected = false;
        self.distanceFromLocation = 660;

        function getNearbyStops() {
            return NearbyService.get(self.userLatitude, self.userLongitude, self.distanceFromLocation)
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
                });
        }

        function getTrimetData() {
            return RouteData.trimet()
                .then(function (data) {
                    self.maxrail = data;
                    return data;
                });
        }

        function getBusData() {
            return RouteData.bus()
                .then(function (data) {
                    self.busRoutes = data;
                    return data;
                });
        }

        self.isStreetCarRoute = trimetUtilities.isStreetCarRoute;
        self.isTrimetRoute = trimetUtilities.isTrimetRoute;
        self.toggleServiceBoundaryOverlay = mapLayers.toggleServiceBoundaryLayer;
        self.toggleTransitCenterOverlay = mapLayers.toggleTransitCenterLayer;
        self.toggleParkAndRidesOverlay = mapLayers.toggleParkAndRidesLayer;
        self.toggleRoute = Navigator.toggleRoute;
        self.toggleNearbyRoute = Navigator.toggleNearbyRoute;
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

            function runAfterTimeout() {
                routeMapInstance.init()
                    .then(getUserLocation)
                    .then(function setUserLocationVariables (exports) {
                        self.latitude = exports.latitude;
                        self.longitude = exports.longitude;
                        return exports;
                    })
                    .then(getNearbyStops)
                    .then(mapLayers.load);
            }

            $timeout(runAfterTimeout, 100);
        }

        init();
    });
