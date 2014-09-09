/**
 * Created by jamesonnyeholt2 on 9/4/14.
 */

angular.module('pdxStreetcarApp')

    .service('StopData', function ($q, $rootScope, trimet, routeMapInstance, RouteColors, RouteData, timeCalcService, userLocation, previouslyOpenedInfoWindow, ArrivalData) {
        var self = this;

        self.nearbyStopMarkers = {};
        self.selectedRouteStops = {};
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

        function stopMarkerIsMemoized(stop) {
           return self.stopMarkers[stop.locid];
        }

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

            if (stopMarkerIsMemoized(stop)) {
              return self.stopMarkers[stop.locid];
            }


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
            if (!self.stopMarkers[stop.locid]) {
              self.stopMarkers[stop.locid] = stopMarker;
            }
            return self.stopMarkers;
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
    });
