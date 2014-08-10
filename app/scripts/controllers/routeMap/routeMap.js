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

    .constant('distanceConversions', {
        FEET_TO_METERS: 0.3048
    })

    .service('feetToMeters', function (distanceConversions) {
        "use strict";
        return function (feet) {
            return feet * distanceConversions.FEET_TO_METERS;
        };
    })

    .controller('RouteMapCtrl', function ($scope, $log, $q, trimet, RouteColors, $timeout, feetToMeters) {
        'use strict';
        var self = this,
            userLatitude,
            userLongitude,
            userLatLng,
            userLocationMarker,
            map,
            userLocationCircle,
            markers = {},
            nearbyStopMarkers = {},
            polylines = {};

        self.distanceFromLocation = 660;

        function clearNearbyStopMarkers() {
            _.forEach(nearbyStopMarkers, function (marker) {
                marker.setMap(null);
            });
        }

        function createGoogleStopMarker(routeId, directionId, stops) {
            var selectedRouteId,
                selectedDirectionId,
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
                    title: stop.desc
                });
                var infoWindow = new google.maps.InfoWindow();
                var infoWindowContent = stop.desc +
                    '<br>' +
                    '<a href="#/streetcar/' +
                    selectedRouteId + '/' +
                    selectedDirectionId + '/' +
                    stop.locid +
                    '">' +
                    'View Arrivals' +
                    '</a>';
                google.maps.event.addListener(stopMarker, 'click', function () {
                    infoWindow.close();
                    infoWindow.setContent(infoWindowContent);
                    infoWindow.open(map, this);
                    map.panTo(this.position);
                    map.setZoom(17);
                });
                addMarkerToMarkerModel(routeId, directionId, stopMarker);
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
                        location.dir +
                        '<br>' +
                        '<a href="#/streetcar/' +
                        stopId +
                        '">' +
                        'View Arrivals for ' +
                        stopId +
                        '</a>';

                google.maps.event.addListener(stopMarker, 'click', function () {
                    infoWindow.close();
                    infoWindow.setContent(infoWindowContent);
                    infoWindow.open(map, this);
                    map.panTo(this.position);
                    map.setZoom(17);
                });

                addMarkerToNearbyStopsModel(stopId, stopMarker);
            }
        }

        function createPolylineForPoints(routeId, directionId, stops) {
            var stopCoordinates = [],
                stopsPolyline,
                stopLatLng;

            function addPolylineToPolylineModel(routeId, directionId, polyline) {
                if (!polylines[routeId]) {
                    polylines[routeId] = {};
                }
                if (!polylines[routeId][directionId]) {
                    polylines[routeId][directionId] = [];
                }
                polylines[routeId][directionId].push(polyline);
            }

            _.forEach(stops, function (stop) {
                stopLatLng = new google.maps.LatLng(stop.lat, stop.lng);
                stopCoordinates.push(stopLatLng);
            });
            stopsPolyline = new google.maps.Polyline({
                path: stopCoordinates,
                geodesic: true,
                strokeColor: RouteColors[routeId],
                strokeOpacity: 1.0,
                strokeWeight: 5
            });
            stopsPolyline.setMap(map);
            addPolylineToPolylineModel(routeId, directionId, stopsPolyline);
        }

        function setRouteMarkers(route) {
            createGoogleStopMarker(route.routeId, route.directionId, route.stops);
            createPolylineForPoints(route.routeId, route.directionId, route.stops);
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

        function formateRetrievedRoutes(data) {
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
        }

        // User Interaction

        function getNearbyRoutes() {

            var radiusInFeet = self.distanceFromLocation;

            clearNearbyStopMarkers();

            nearbyStopMarkers = {};

            function provideListOfNearbyStops(data) {
                _.forEach(data.resultSet.location, function (location) {
                    location.enabled = true;
                });
                self.nearbyStops = data.resultSet.location;
                return data;
            }

            function setRadiusAroundUser() {
                if (userLocationCircle) {
                    userLocationCircle.setMap(null);
                }

                userLocationCircle = new google.maps.Circle({
                    map: map,
                    radius: feetToMeters(radiusInFeet),    // 10 miles in metres
                    strokeColor: '#AA0000',
                    fillColor: '#AA0000'
                });
                userLocationCircle.bindTo('center', userLocationMarker, 'position');
            }

            function displayRoutesAndStops(data) {
                _.forEach(data.resultSet.location, function (location) {
                    location.enabled = true;
                    createNearbyStopMarker(location);
                });
            }

            function enableStopMarkers() {
                _.forEach(nearbyStopMarkers, function (stopMarker) {
                    stopMarker.setMap(map);
                });
            }

            setRadiusAroundUser();

            trimet.getStopsAroundLocation(userLatitude, userLongitude, radiusInFeet)
                .then(provideListOfNearbyStops)
                .then(displayRoutesAndStops)
                .then(enableStopMarkers);
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
                .then(formateRetrievedRoutes)
                .then(function (result) {
                    self.streetcar = result;
                });
        }

        function getTrimetData() {
            trimet.rail.getRoutes()
                .then(formateRetrievedRoutes)
                .then(function (result) {
                    self.maxRail = result;
                });
        }

        function getBusData() {
            trimet.bus.getRoutes()
                .then(formateRetrievedRoutes)
                .then(function (result) {
                    self.busRoutes = result;
                });
        }

        self.toggleRoute = toggleRoute;

        self.getNearbyRoutes = getNearbyRoutes;

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
                            {visibility: "off"}
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
                map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
                transitLayer = new google.maps.TransitLayer();

                transitLayer.setMap(map);

                deferred.resolve();

                return deferred.promise;
            }

            $timeout(function () {
                createMap()
                    .then(setUserLocationMarker)
                    .then(getNearbyRoutes);
            }, 500);
        }

        init();
    });
