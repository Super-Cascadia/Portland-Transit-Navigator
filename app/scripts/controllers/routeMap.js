angular.module('pdxStreetcarApp')
    .controller('RouteMapCtrl', function ($scope, $log, trimet) {
        'use strict';

        function createMap() {
            var latLng,
                mapOptions,
                map,
                stopMarker,
                stopLatLng,
                userLatLng,
                userLocationMarker,
                transitLayer;

            function handleNoGeolocation(errorFlag) {
                if (errorFlag) {
                    content = 'Error: The Geolocation service failed.';
                } else {
                    content = 'Error: Your browser doesn\'t support geolocation.';
                }
            }

            function setStopMarkers() {
                function createGoogleStopMarker(stop) {
                    stopLatLng =  new google.maps.LatLng(stop.lat, stop.lng);
                    stopMarker = new google.maps.Marker({
                        map: map,
                        position: stopLatLng,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 5
                        },
                        animation: google.maps.Animation.DROP,
                        clickable: true,
                        title: stop.desc
                    });

                    var infowindow = new google.maps.InfoWindow();

                    google.maps.event.addListener(stopMarker, 'click', function() {
                        infowindow.close();
                        infowindow.setContent(stop.desc);
                        infowindow.open(map, this);
                        map.panTo(this.position);
                        map.setZoom(17);
                    });

                }
                _.forEach($scope.selectedRoute.dir[0].stop, createGoogleStopMarker);
                _.forEach($scope.selectedRoute.dir[1].stop, createGoogleStopMarker);

            }

            function setUserLocationMarker() {
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

            latLng = new google.maps.LatLng(45.5200, -122.6819);
            mapOptions = {
                center: latLng,
                zoom: 15,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            transitLayer = new google.maps.TransitLayer();
            setStopMarkers();
            setUserLocationMarker();
            transitLayer.setMap(map);
        }

        $scope.isRouteSelected = function (route) {
            if ($scope.selectedRoute && route) {
                return route.route === $scope.selectedRoute.route;
            }
        };

        $scope.selectRoute = function (route) {
            $scope.selectedRoute = null;
            $scope.selectedRoute = route;
            createMap();
        };

        function getStreetCarRoutes() {
            trimet.streetcar.getRoutes(function getSuccess(response) {
                $scope.routes = response.resultSet.route;
                $scope.selectRoute($scope.routes[0]);
                createMap();
            }, function getError(response) {
                $log.error("Could not get routes for streetcar.");
            });
        }

        getStreetCarRoutes();

    });
