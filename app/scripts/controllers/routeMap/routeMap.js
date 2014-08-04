angular.module('pdxStreetcarApp')
    .constant('RouteColors', {
        "193": "89C831",
        "194": "00A9CE",
        "100": "0062A9",
        "200": "008850",
        "90": "D30E41",
        "190": "FFC500"
    })

    .controller('RouteMapCtrl', function ($scope, $log, $q, trimet, RouteColors, $timeout) {
        'use strict';
        var self = this,
            map,
            markers = {},
            polylines = {};

        self.streetcar = {
            '193': {
                name: 'NS Line',
                directions: [
                    {
                        color: '#' + RouteColors[193],
                        routeId: 193,
                        directionId: 0,
                        enabled: false,
                        displayName: "To South Waterfront"
                    },
                    {
                        color: '#' + RouteColors[193],
                        routeId: 193,
                        directionId: 1,
                        enabled: false,
                        displayName: "To NW 23rd St"
                    }
                ]
            },
            '194': {
                name: "CL Line",
                directions: [
                    {
                        color: '#' + RouteColors[194],
                        routeId: 194,
                        directionId: 0,
                        enabled: false,
                        displayName: "Portland City Center/PSU"
                    },
                    {
                        color: '#' + RouteColors[194],
                        routeId: 194,
                        directionId: 1,
                        enabled: false,
                        displayName: "To Rose Quarter/OMSI"
                    }
                ]
            }
        };

        self.maxRail = {
            '100': {
                'name': 'Blue Line',
                'directions': [
                    {
                        color: '#' + RouteColors[100],
                        routeId: 100,
                        directionId: 0,
                        enabled: false,
                        displayName: "To Gresham"
                    },
                    {
                        color: '#' + RouteColors[100],
                        routeId: 100,
                        directionId: 1,
                        enabled: false,
                        displayName: "To Hillsboro"
                    }
                ]
            },
            '200': {
                'name': 'Green Line',
                'directions': [
                    {
                        color: '#' + RouteColors[200],
                        routeId: 200,
                        directionId: 0,
                        enabled: false,
                        displayName: "To Clackamas Town Center"
                    },
                    {
                        color: '#' + RouteColors[200],
                        routeId: 200,
                        directionId: 1,
                        enabled: false,
                        displayName: "To Portland City Center/PSU"
                    }
                ]
            },
            '90': {
                'name': 'Red Line',
                'directions': [
                    {
                        color: '#' + RouteColors[90],
                        routeId: 90,
                        directionId: 0,
                        enabled: false,
                        displayName: "To Portland International Airport"
                    },
                    {
                        color: '#' + RouteColors[90],
                        routeId: 90,
                        directionId: 1,
                        enabled: false,
                        displayName: "To Beaverton TC"
                    }
                ]
            },
            '190': {
                'name': 'Gold Line',
                'directions': [
                    {
                        color: '#' + RouteColors[190],
                        routeId: 190,
                        directionId: 0,
                        enabled: false,
                        displayName: "To Expo Center"
                    },
                    {
                        color: '#' + RouteColors[190],
                        routeId: 190,
                        directionId: 1,
                        enabled: false,
                        displayName: "To Portland City Center/PSU"
                    }
                ]
            }
        };

        self.fooBar = {
            '1': {
                name: "1-Vermont",
                directions: [
                    {
                        routeId: 1,
                        directionId: 0,
                        enabled: false,
                        displayName: 'To Gresham Transit Center'
                    },
                    {
                        routeId: 1,
                        directionId: 1,
                        enabled: false,
                        displayName: 'To St. Johns'
                    }
                ]
            },
            '4': {
                name: "4-Division/Fessenden",
                frequentService: true,
                directions: [
                    {
                        routeId: 4,
                        directionId: 0,
                        enabled: false,
                        displayName: 'Division'
                    },
                    {
                        routeId: 4,
                        directionId: 1,
                        enabled: false,
                        displayName: 'Fessenden'
                    }
                ]
            },
            '6': {
                name: "4-Martin Luther King Jr. Blvd",
                frequentService: true,
                directions: [
                    {
                        routeId: 6,
                        directionId: 0,
                        enabled: false,
                        displayName: 'MLK'
                    },
                    {
                        routeId: 6,
                        directionId: 1,
                        enabled: false,
                        displayName: 'MLk'
                    }
                ]
            },
            '8': {
                name: "8-Jackson Park/NE 15th",
                frequentService: true,
                directions: [
                    {
                        routeId: 8,
                        directionId: 0,
                        enabled: false,
                        displayName: 'Jackson Park'
                    },
                    {
                        routeId: 8,
                        directionId: 1,
                        enabled: false,
                        displayName: 'NE 15th'
                    }
                ]
            },
            '9': {
                name: "9-Powell Blvd",
                frequentService: true,
                directions: [
                    {
                        routeId: 9,
                        directionId: 0,
                        enabled: false,
                        displayName: 'Eastbound'
                    },
                    {
                        routeId: 8,
                        directionId: 1,
                        enabled: false,
                        displayName: 'Westbound'
                    }
                ]
            }
        };

        function setUserLocationMarker() {
            var userLatLng,
                userLocationMarker;

            function handleNoGeolocation(errorFlag) {
                var content;
                if (errorFlag) {
                    content = 'Error: The Geolocation service failed.';
                } else {
                    content = 'Error: Your browser doesn\'t support geolocation.';
                }
            }

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

        function createMap() {
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
        }

        function toggleRoute(route) {
            var origEnabledValue = route.enabled;

            function setRouteMarkers(route) {
                function createGoogleStopMarker(routeId, directionId, stops) {
                    var selectedRouteId,
                        selectedDirectionId,
                        stopMarker,
                        stopLatLng,
                        pinColor = RouteColors[routeId],
                        pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
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

            function correctEnabledValue(route) {
                if (route.enabled !== origEnabledValue) {
                    route.enabled = origEnabledValue;
                }
            }

            if (!route.stops) {
                trimet.getStops(route.routeId)
                    .then(function (data) {
                        correctEnabledValue(route);
                        route.stops = data.resultSet.route[0].dir[route.directionId].stop;
                        if (!markers[route.routeId]) {
                            setRouteMarkers(route);
                        }
                        toggleEnabledFlags(route);
                    });
            } else {
                correctEnabledValue(route);
                if (!markers[route.routeId]) {
                    setRouteMarkers(route);
                }
                toggleEnabledFlags(route);
            }
        }

        function formatBusRoutes(data) {
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
            self.busRoutes = result;
        }


        function init() {
            trimet.bus.getAllRoutes()
                .then(formatBusRoutes);

            $timeout(function () {
                createMap();
                setUserLocationMarker();
            }, 500);
        }

        self.toggleRoute = toggleRoute;

        init();
    });
