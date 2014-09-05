/**
 * Created by jamesonnyeholt2 on 9/4/14.
 */

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
    });
