angular.module('pdxStreetcarApp')

    .constant('RouteColors',  {
        "193": "89C831",
        "194": "00A9CE",
        "100": "0062A9",
        "200": "008850",
        "90": "D30E41",
        "190": "FFC500"
    })

    .controller('RouteMapCtrl', function ($scope, $log, $q, trimet, RouteColors) {
        'use strict';

        var map,
            markers = {},
            polylines = {};

        $scope.streetcar = {
            '193': {
                '0': {
                    color: '#' + RouteColors[193],
                    routeId: 193,
                    directionId: 0,
                    enabled: false,
                    displayName: "To South Waterfront"
                },
                '1': {
                    color: '#' + RouteColors[193],
                    routeId: 193,
                    directionId: 1,
                    enabled: false,
                    displayName: "To NW 23rd St"
                }
            },
            '194': {
                '0': {
                    color: '#' + RouteColors[194],
                    routeId: 194,
                    directionId: 0,
                    enabled: false,
                    displayName: "Portland City Center/PSU"
                },
                '1': {
                    color: '#' + RouteColors[194],
                    routeId: 194,
                    directionId: 1,
                    enabled: false,
                    displayName: "To Rose Quarter/OMSI"
                }
            }
        };

        $scope.maxRail = {
            '100': {
                '0': {
                    color: '#' + RouteColors[100],
                    routeId: 100,
                    directionId: 0,
                    enabled: false,
                    displayName: "To Gresham"
                },
                '1': {
                    color: '#' + RouteColors[100],
                    routeId: 100,
                    directionId: 1,
                    enabled: false,
                    displayName: "To Hillsboro"
                }
            },
            '200': {
                '0': {
                    color: '#' + RouteColors[200],
                    routeId: 200,
                    directionId: 0,
                    enabled: false,
                    displayName: "To Clackamas Town Center"
                },
                '1': {
                    color: '#' + RouteColors[200],
                    routeId: 200,
                    directionId: 1,
                    enabled: false,
                    displayName: "To Portland City Center/PSU"
                }
            },
            '90': {
                '0': {
                    color: '#' + RouteColors[90],
                    routeId: 90,
                    directionId: 0,
                    enabled: false,
                    displayName: "To Portland International Airport"
                },
                '1': {
                    color: '#' + RouteColors[90],
                    routeId: 90,
                    directionId: 1,
                    enabled: false,
                    displayName: "To Beaverton TC"
                }
            },
            '190': {
                '0': {
                    color: '#' + RouteColors[190],
                    routeId: 190,
                    directionId: 0,
                    enabled: false,
                    displayName: "To Expo Center"
                },
                '1': {
                    color: '#' + RouteColors[190],
                    routeId: 190,
                    directionId: 1,
                    enabled: false,
                    displayName: "To Portland City Center/PSU"
                }
            }
        };

        $scope.busRoutes = {

        };

        function handleNoGeolocation(errorFlag) {
            var content;
            if (errorFlag) {
                content = 'Error: The Geolocation service failed.';
            } else {
                content = 'Error: Your browser doesn\'t support geolocation.';
            }
        }

        function addMarkerToMarkerModel(routeId, directionId, stopMarker) {
            if (!markers[routeId]) {
                markers[routeId] = {};
            }
            if (!markers[routeId][directionId]) {
                markers[routeId][directionId] = [];
            }
            markers[routeId][directionId].push(stopMarker);
        }

        function addPolylineToPolylineModel(routeId, directionId, polyline) {
            if (!polylines[routeId]) {
                polylines[routeId] = {};
            }
            if (!polylines[routeId][directionId]) {
                polylines[routeId][directionId] = [];
            }
            polylines[routeId][directionId].push(polyline);
        }

        function setAllMapMarkers(map, route, direction) {
            if (markers[route][direction]) {
                _.forEach(markers[route][direction], function (marker) {
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

        function hideRouteMarkers(route, direction) {
            setAllMapMarkers(null, route, direction);
        }

        function hideRoutePolyline(route, direction) {
            setAllMapPolylines(null, route, direction);
        }

        function hideRoute (route, direction) {
            hideRouteMarkers(route, direction);
            hideRoutePolyline(route, direction);
        }

        function showRouteMarkers(route, direction) {
            setAllMapMarkers(map, route, direction);
        }

        function showRoutePolyline(route, direction) {
            setAllMapPolylines(map, route, direction);
        }

        function showRoute(route, direction) {
            showRouteMarkers(route, direction);
            showRoutePolyline(route, direction);
        }

        function createGoogleStopMarker(routeId, directionId, stops) {
            var selectedRouteId,
                selectedDirectionId,
                stopMarker,
                stopLatLng;

            var pinColor = RouteColors[routeId];
            var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
                new google.maps.Size(21, 34),
                new google.maps.Point(0,0),
                new google.maps.Point(10, 34));
            var pinShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
                new google.maps.Size(40, 37),
                new google.maps.Point(0, 0),
                new google.maps.Point(12, 35));

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

        function setStopMarkers(routes) {
            var routeId,
                directionId;
            _.forEach(routes, function iterateOverRoutes(route, index, collection) {
                routeId = route.route;
                if (route.dir && route.dir.length > 0) {
                    _.forEach(route.dir, function iterateOverDirections(direction) {
                        directionId = direction.dir;
                        if (direction.stop && direction.stop.length > 0) {
                            createGoogleStopMarker(routeId, directionId, direction.stop);
                            createPolylineForPoints(routeId, directionId, direction.stop);
                        }
                    });
                }
            });
        }

        function setUserLocationMarker() {
            var userLatLng,
                userLocationMarker;
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
                styles: [{featureType:"administrative",stylers:[{visibility:"off"}]},{featureType:"poi",stylers:[{visibility:"simplified"}]},{featureType:"road",elementType:"labels",stylers:[{visibility:"simplified"}]},{featureType:"water",stylers:[{visibility:"simplified"}]},{featureType:"transit",stylers:[{visibility:"simplified"}]},{featureType:"landscape",stylers:[{visibility:"simplified"}]},{featureType:"road.highway",stylers:[{visibility:"off"}]},{featureType:"road.local",stylers:[{visibility:"on"}]},{featureType:"road.highway",elementType:"geometry",stylers:[{visibility:"on"}]},{featureType:"water",stylers:[{color:"#84afa3"},{lightness:52}]},{stylers:[{saturation:-17},{gamma:0.36}]},{featureType:"transit.line",elementType:"geometry",stylers:[{color:"#3f518c"}]}]
            };
            map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            transitLayer = new google.maps.TransitLayer();
            transitLayer.setMap(map);
        }

        function isRouteSelected(route) {
            if ($scope.selectedRoute && route) {
                return route.route === $scope.selectedRoute.route;
            }
        }

        function selectRoute(route) {
            $scope.selectedRoute = null;
            $scope.selectedRoute = route;
            createMap();
        }

        function getBusRoutes() {
            return trimet.bus.getRoutes();
        }

        function getRailRoutes() {
            return trimet.rail.getRoutes();
        }

        function onBusRoutesRetrievedSuccess(data) {
            $scope.busRoutes = data;
//            setStopMarkers(data.resultSet.route);
        }

        function setMaxRailEnabled() {
            $scope.maxRail[100][0].enabled = true;
            $scope.maxRail[100][1].enabled = true;
            $scope.maxRail[200][0].enabled = true;
            $scope.maxRail[200][1].enabled = true;
            $scope.maxRail[90][0].enabled = true;
            $scope.maxRail[90][1].enabled = true;
            $scope.maxRail[190][0].enabled = true;
            $scope.maxRail[190][1].enabled = true;
        }

        function onRailRoutesRetrievedSuccess(data) {
            $scope.railRoutes = data;
            setStopMarkers(data.resultSet.route);
            setMaxRailEnabled();
        }

        function retrieveRemainingRoutes() {
            getBusRoutes()
                .then(onBusRoutesRetrievedSuccess);
            getRailRoutes()
                .then(onRailRoutesRetrievedSuccess);
        }

        function toggleRoute(route) {
            if (route) {
                if (route.enabled === true) {
                    route.enabled = false;
                    hideRoute(route.routeId, route.directionId);
                    if (_.contains(route.routeId, [193, 194])) {
                        $scope.streetcar[route.routeId][route.directionId].enabled = true;
                    } else {
                        $scope.maxRail[route.routeId][route.directionId].enabled = true;
                    }
                } else {
                    route.enabled = true;
                    showRoute(route.routeId, route.directionId);
                    if (_.contains(route.routeId, [193, 194])) {
                        $scope.streetcar[route.routeId][route.directionId].enabled = false;
                    } else {
                        $scope.maxRail[route.routeId][route.directionId].enabled = false;
                    }
                }
            }
        }

        function setStreetcarToEnabled() {
            $scope.streetcar[193][0].enabled = true;
            $scope.streetcar[193][1].enabled = true;
            $scope.streetcar[194][0].enabled = true;
            $scope.streetcar[194][1].enabled = true;
        }

        function onStreetCarRouteRetrievalSuccess(data) {
            $scope.routes = data.resultSet.route;
            createMap();
            setStopMarkers(data.resultSet.route);
            setStreetcarToEnabled();
        }

        function onStreetCarRouteRetrievalError(error) {
            $log.error("Could not get routes for streetcar.");
        }

        function getStreetCarRoutes() {
            return trimet.streetcar.getRoutes()
                .then(onStreetCarRouteRetrievalSuccess, onStreetCarRouteRetrievalError)
                .then(setUserLocationMarker)
                .then(retrieveRemainingRoutes);
        }

        function init() {
            getStreetCarRoutes();
        }

        init();

        $scope.isRouteSelected = isRouteSelected;
        $scope.selectRoute = selectRoute;
        $scope.toggleRoute = toggleRoute;
    });
