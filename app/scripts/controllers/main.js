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


    .service('feetToMeters', function (distanceConversions) {
        "use strict";
        return function (feet) {
            return feet * distanceConversions.FEET_TO_METERS;
        };
    })

    .service('routeMapInstance', function () {
        var self = this;

        self.map = null;

        self.set = function (map) {
            self.map = map;
        };

        self.get = function () {
            return self.map;
        };

        self.clear = function () {
            self.map = null;
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


    .directive('psFullHeightLeftCol', ['$parse', '$timeout',
        function () {
            return function (scope, element) {
                var resize;
                resize = function () {
                    var calculatedHeight,
                        windowHeight,
                        navHeader = 52,
                        search = 60,
                        tabs = 80;
                    windowHeight = $(window).height();
                    calculatedHeight = windowHeight - navHeader - search - tabs;
                    return element.css({
                        'min-height': calculatedHeight,
                        'max-height': calculatedHeight,
                        'height': calculatedHeight
                    });
                };
                resize();
                $(window).bind('DOMMouseScroll', function () {
                    return resize();
                });
                return $(window).resize(function () {
                    return resize();
                });
            };
        }
    ])

    .directive('psFullHeightRightCol', ['$parse', '$timeout',
        function () {
            return function (scope, element) {
                var resize;
                resize = function () {
                    var calculatedHeight,
                        windowHeight,
                        navHeader = 52,
                        offset = 20;
                    windowHeight = $(window).height();
                    calculatedHeight = windowHeight - navHeader - offset;
                    return element.css({
                        'min-height': calculatedHeight,
                        'max-height': calculatedHeight,
                        'height': calculatedHeight
                    });
                };
                resize();
                $(window).bind('DOMMouseScroll', function () {
                    return resize();
                });
                return $(window).resize(function () {
                    return resize();
                });
            };
        }
    ])


    .controller('topNavigationCtrl', function ($scope, $routeParams, $log, $route, $location, geolocation, $state, $stateParams) {
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


    .controller('RouteMapCtrl', function ($scope, $log, $q, $http, trimet, RouteColors, $timeout, feetToMeters, timeCalcService, formatRetrievedRoutes, trimetUtilities, routeMapInstance) {
        'use strict';
        var self = this,
            userLatitude,
            userLongitude,
            userLatLng,
            userLocationMarker,
            stopRadiusIndicator,
            trimetBoundaryLayer,
            trimetTransitCenterLayer,
            trimetParkAndRidesLayer,
            showParkAndRidesLayer = false,
            showTransitCenterLayer = false,
            showBoundaryLayer = false,
            map,
            geoJsonRoutes,
            geoJsonLayer,
            geoJsonRouteLayers = {},
            markers = {},
            previouslyOpenedInfoWindow,
            nearbyStopMarkers = {},
            polylines = {};

        self.stopIsSelected = false;
        self.distanceFromLocation = 660;

        function toggleNearbyRoute(route) {
            if (geoJsonRouteLayers[route.route]) {
                var directions = geoJsonRouteLayers[route.route];
                _.forEach(directions, function (direction) {
                    map.data.remove(direction[0]);
                });
            }
        }

        function createGoogleStopMarker(routeId, directionId, stops) {
            var infoWindow,
                infoWindowContent,
                stopMarker,
                stopLatLng,
                pinColor = RouteColors[routeId];

            if (!pinColor) {
                pinColor = RouteColors['default'];
            }

            var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
                    new google.maps.Size(21, 34),
                    new google.maps.Point(0, 0),
                    new google.maps.Point(10, 34)),
                pinShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
                    new google.maps.Size(40, 37),
                    new google.maps.Point(0, 0),
                    new google.maps.Point(12, 35));

            function addMarkerToMarkerModel(routeId, directionId, stopMarker) {
                if (!markers[routeId]) {
                    markers[routeId] = {};
                }
                if (!markers[routeId][directionId]) {
                    markers[routeId][directionId] = [];
                }
                markers[routeId][directionId].push(stopMarker);
            }

            _.forEach(stops, function (stop) {
                stopLatLng = new google.maps.LatLng(stop.lat, stop.lng);
                stopMarker = new google.maps.Marker({
                    map: map,
                    position: stopLatLng,
                    icon: pinImage,
                    shadow: pinShadow,
                    animation: google.maps.Animation.DROP,
                    clickable: true,
                    title: stop.desc + ":" + stop.dir
                });

                infoWindow = new google.maps.InfoWindow();
                infoWindowContent = stop.desc;

                google.maps.event.addListener(stopMarker, 'click', function () {
                    if (previouslyOpenedInfoWindow) {
                        previouslyOpenedInfoWindow.close();
                    }
                    infoWindow.setContent(infoWindowContent);
                    infoWindow.open(map, this);
                    map.panTo(this.position);
                    map.setZoom(17);
                    previouslyOpenedInfoWindow = infoWindow;

                    showArrivalsForStop(stopMarker);
                });

                stopMarker.stopMetaData = stop;

                addMarkerToMarkerModel(routeId, directionId, stopMarker);
            });
        }

        function showRouteLine(routeId, directionId) {

            var route;

            function enableRouteLine(route) {
                var featureCollection = {
                        "type": "FeatureCollection",
                        "features": []
                    },
                    layer;

                function memoizeGeoJsonLayer(routeId, directionId, layer) {
                    if (!geoJsonRouteLayers[routeId]) {
                        geoJsonRouteLayers[routeId] = {};
                    }
                    if (!geoJsonRouteLayers[routeId][directionId]) {
                        geoJsonRouteLayers[routeId][directionId] = layer;
                    }
                }

                featureCollection.features.push(route);
                layer = map.data.addGeoJson(featureCollection);
                memoizeGeoJsonLayer(routeId, directionId, layer);
            }

            function getGeoJsonFeature() {
                return _.find(geoJsonRoutes.features, function (route) {
                    return parseInt(route.properties.route_number) === routeId && parseInt(route.properties.direction) === directionId;
                });
            }

            route = getGeoJsonFeature(routeId, directionId);
            enableRouteLine(route);
        }

        function setRouteMarkers(route) {
            createGoogleStopMarker(route.routeId, route.directionId, route.stops);
            showRouteLine(route.routeId, route.directionId);
        }

        function toggleEnabledFlags(route) {
            function setAllMapMarkers(map, route, direction) {
                var stopMarkers = markers[route][direction];
                if (stopMarkers && _.isArray(stopMarkers)) {
                    _.forEach(stopMarkers, function (marker) {
                        marker.setMap(map);
                    });
                }
            }

            function setAllMapPolylines(map, route, direction) {
                if (polylines[route][direction]) {
                    _.forEach(polylines[route][direction], function (polyline) {
                        polyline.setMap(map);
                    });
                }
            }

            function hideRoute(route, direction) {
                setAllMapMarkers(null, route, direction);
                setAllMapPolylines(null, route, direction);
            }

            function showRoute(route, direction) {
                setAllMapPolylines(map, route, direction);
                setAllMapMarkers(map, route, direction);
            }

            if (route.enabled === true) {
                route.enabled = false;
                hideRoute(route.routeId, route.directionId);
            } else if (route.enabled === false) {
                route.enabled = true;
                showRoute(route.routeId, route.directionId);
            }
        }

        function showArrivalsForStop(stopMarker) {
            return trimet.getArrivalsForStop(stopMarker.stopMetaData.locid)
                .then(function (data) {
                    return timeCalcService.calculateRelativeTimes(data, data.resultSet.queryTime)
                        .then(function (arrivalInfo) {
                            self.selectedStop = arrivalInfo;
                            self.remainingTime = self.selectedStop.resultSet.arrival[0].remainingTime;
                            self.arrivalInfo = self.selectedStop.resultSet.arrival[0];
                            self.stopIsSelected = true;
                        });
                });
        }

        // User Interaction

        function getNearbyStops() {

            var radiusInFeet = self.distanceFromLocation;

            function clearNearbyStopMarkers() {
                _.forEach(nearbyStopMarkers, function (marker) {
                    marker.setMap(null);
                });
            }

            function createNearbyStopMarker(location) {

                function addMarkerToNearbyStopsModel (stopId, stopMarker) {
                    nearbyStopMarkers[stopId] = stopMarker;
                }

                if (!nearbyStopMarkers[location.locid]) {
                    var stopId = location.locid,
                        latitude =  location.lat,
                        longitude = location.lng,
                        pinColor = RouteColors[stopId];

                    if (!pinColor) {
                        pinColor = RouteColors['default'];
                    }

                    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
                            new google.maps.Size(21, 34),
                            new google.maps.Point(0, 0),
                            new google.maps.Point(10, 34)),
                        pinShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
                            new google.maps.Size(40, 37),
                            new google.maps.Point(0, 0),
                            new google.maps.Point(12, 35)),
                        stopLatLng = new google.maps.LatLng(latitude, longitude),
                        stopMarker = new google.maps.Marker({
                            map: map,
                            position: stopLatLng,
                            icon: pinImage,
                            shadow: pinShadow,
                            animation: google.maps.Animation.DROP,
                            clickable: true,
                            title: location.desc + ":" + location.dir
                        }),

                        infoWindow = new google.maps.InfoWindow(),
                        infoWindowContent = location.desc +
                            ": " +
                            location.dir;

                    google.maps.event.addListener(stopMarker, 'click', function () {
                        if (previouslyOpenedInfoWindow) {
                            previouslyOpenedInfoWindow.close();
                        }
                        infoWindow.setContent(infoWindowContent);
                        infoWindow.open(map, this);
                        map.panTo(this.position);
                        map.setZoom(17);
                        previouslyOpenedInfoWindow = infoWindow;

                        showArrivalsForStop(stopMarker);
                    });

                    stopMarker.stopMetaData = location;

                    addMarkerToNearbyStopsModel(stopId, stopMarker);
                }
            }

            function provideListOfNearbyStops(data) {
                _.forEach(data.resultSet.location, function (location) {
                    location.enabled = true;
                });
                self.nearbyStops = data.resultSet.location;
                return data;
            }

            function provideListOfNearbyRoutes(data) {
                var routes = {};
                _.forEach(data.resultSet.location, function (location) {
                    _.forEach(location.route, function (route) {
                        if (!routes[route.route]) {
                            routes[route.route] = route;
                            routes[route.route].stops = {};
                        }
                        if (!routes[route.route].stops) {
                            routes[route.route].stops = {};
                        }
                        if (!routes[route.route].stops[location.locid]) {
                            routes[route.route].stops[location.locid] = location;
                        }
                        if (routes[route.route].dir[0].dir !== route.dir[0].dir) {
                            routes[route.route].dir.push(route.dir[0]);
                        }
                    });
                });
                self.nearbyRoutes = routes;
                return data;
            }

            function setRadiusAroundUser() {
                if (stopRadiusIndicator) {
                    stopRadiusIndicator.setMap(null);
                }

                stopRadiusIndicator = new google.maps.Circle({
                    map: map,
                    radius: feetToMeters(radiusInFeet),    // 10 miles in metres
                    strokeColor: '#AA0000',
                    fillColor: '#AA0000'
                });

                stopRadiusIndicator.bindTo('center', userLocationMarker, 'position');
            }

            function displayNearbyStops(data) {
                _.forEach(data.resultSet.location, function (location) {
                    location.enabled = true;
                    createNearbyStopMarker(location);
                });
                return data;
            }

            function displayNearbyRouteLines(data) {
                _.forEach(self.nearbyRoutes, function (route) {
                    _.forEach(route.dir, function (direction) {
                        showRouteLine(route.route, direction.dir);
                    });
                });
                return data;
            }

            setRadiusAroundUser();

            clearNearbyStopMarkers();

            nearbyStopMarkers = {};

            trimet.getStopsAroundLocation(userLatitude, userLongitude, radiusInFeet)
                .then(provideListOfNearbyStops)
                .then(provideListOfNearbyRoutes)
                .then(displayNearbyStops)
                .then(displayNearbyRouteLines);
        }

        function toggleRoute(route) {
            var origEnabledValue;

            function correctEnabledValue(route) {
                if (route.enabled !== origEnabledValue) {
                    route.enabled = origEnabledValue;
                }
            }

            if (route) {
                origEnabledValue = route.enabled;

                correctEnabledValue(route);

                if (!markers[route.routeId]) {
                    markers[route.routeId] = {};
                }
                if (!markers[route.routeId][route.directionId]) {
                    setRouteMarkers(route);
                }
                toggleEnabledFlags(route);
            }
        }

        function getStreetCarData() {
            trimet.streetcar.getRoutes()
                .then(formatRetrievedRoutes)
                .then(function (result) {
                    self.streetcar = result;
                });
        }

        function getTrimetData() {
            trimet.rail.getRoutes()
                .then(formatRetrievedRoutes)
                .then(function (result) {
                    self.maxRail = result;
                });
        }

        function getBusData() {
            trimet.bus.getRoutes()
                .then(formatRetrievedRoutes)
                .then(function (result) {
                    self.busRoutes = result;
                });
        }

        function toggleServiceBoundaryOverlay() {
            if (!showTransitCenterLayer) {
                showTransitCenterLayer = true;
                trimetBoundaryLayer.setMap(map);
            } else {
                showTransitCenterLayer = false;
                trimetBoundaryLayer.setMap(null);
            }
        }

        function toggleTransitCenterOverlay() {
            if (!showBoundaryLayer) {
                showBoundaryLayer = true;
                trimetTransitCenterLayer.setMap(map);
            } else {
                showBoundaryLayer = false;
                trimetTransitCenterLayer.setMap(null);
            }
        }

        function toggleParkAndRidesOverlay() {
            if (!showParkAndRidesLayer) {
                showParkAndRidesLayer = true;
                trimetParkAndRidesLayer.setMap(map);
            } else {
                showParkAndRidesLayer = false;
                trimetParkAndRidesLayer.setMap(null);
            }
        }



        self.isStreetCarRoute = trimetUtilities.isStreetCarRoute;

        self.isTrimetRoute = trimetUtilities.isTrimetRoute;

        self.toggleServiceBoundaryOverlay = toggleServiceBoundaryOverlay;

        self.toggleTransitCenterOverlay = toggleTransitCenterOverlay;

        self.toggleParkAndRidesOverlay = toggleParkAndRidesOverlay;

        self.toggleRoute = toggleRoute;

        self.toggleNearbyRoute = toggleNearbyRoute;

        self.getNearbyRoutes = getNearbyStops;

        self.getStreetCarData = getStreetCarData;

        self.getTrimetData = getTrimetData;

        self.getBusData = getBusData;

        // Init

        function init() {

            function setUserLocationMarker() {
                var deferred = $q.defer();

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
                            userLatitude = position.coords.latitude;
                            userLongitude = position.coords.longitude;
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
                            deferred.resolve();
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

            function createMap() {
                var deferred = $q.defer();

                var latLng,
                    mapOptions,
                    transitLayer;

                latLng = new google.maps.LatLng(45.5200, -122.6819);
                mapOptions = {
                    center: latLng,
                    zoom: 13,
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
                if (routeMapInstance.map) {
                    routeMapInstance.clear();
                }
                map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
                routeMapInstance.set(map);
                transitLayer = new google.maps.TransitLayer();
                //                transitLayer.setMap(map);

                deferred.resolve();

                return deferred.promise;
            }

            function loadLayers() {
                trimetBoundaryLayer = new google.maps.KmlLayer({
                    url: 'http://developer.trimet.org/gis/data/tm_boundary.kml'
                });
                trimetTransitCenterLayer = new google.maps.KmlLayer({
                    url: 'http://developer.trimet.org/gis/data/tm_tran_cen.kml'
                });
                trimetParkAndRidesLayer = new google.maps.KmlLayer({
                    url: 'http://developer.trimet.org/gis/data/tm_parkride.kml'
                });
            }

            function getRouteGeoJson() {
                var deferred = $q.defer();
                $.ajax({
                    type: 'GET',
                    url:'data/kml/tm_routes.kml'
                })
                    .done(function(xml) {
                        geoJsonRoutes = toGeoJSON.kml(xml);
                        deferred.resolve(geoJsonRoutes);
                    });
                return deferred.promise;
            }

            function runAfterTimeout() {
                createMap()
                    .then(loadLayers)
                    .then(setUserLocationMarker)
                    .then(getRouteGeoJson)
                    .then(getNearbyStops);
            }

            $timeout(runAfterTimeout, 100);


        }

        init();
    })

    .controller('MainCtrl', function ($scope, $log, $location, geolocation, timeCalcService) {

        // Variables
        $scope.showStreetcarServiceWarning = false;
        $scope.streetcarScheduleMessage = "";

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

        $scope.geoLocate = function () {
            geoLocate();
        };

        determineIfServiceIsAvailable();
    });
