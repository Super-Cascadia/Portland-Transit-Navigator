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

        var map;

        $scope.streetcarRoutes = {
            nsToSouthWaterfront: false,
            nsToNw23rd: false,
            clToPsu: false,
            clToConventionCenter: false
        };

        $scope.railRoutes = {

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

        function createGoogleStopMarker(routeId, stops) {
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
            });


        }

        function createPolylineForPoints(routeId, stops) {
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
        }

        function setStopMarkers(routes) {
            var routeId;
            _.forEach(routes, function iterateOverRoutes(route, index, collection) {
                routeId = route.route;
                if (route.dir && route.dir.length > 0) {
                    _.forEach(route.dir, function iterateOverDirections(direction) {
                        if (direction.stop && direction.stop.length > 0) {
                            createGoogleStopMarker(routeId, direction.stop);
                            createPolylineForPoints(routeId, direction.stop);
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

        function onRailRoutesRetrievedSuccess(data) {
            $scope.railRoutes = data;
            setStopMarkers(data.resultSet.route);
        }

        function retrieveRemainingRoutes() {
            getBusRoutes()
                .then(onBusRoutesRetrievedSuccess);
            getRailRoutes()
                .then(onRailRoutesRetrievedSuccess);
        }

        function onStreetCarRouteRetrievalSuccess(data) {
            $scope.routes = data.resultSet.route;
            createMap();
            setStopMarkers(data.resultSet.route);
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
    });
