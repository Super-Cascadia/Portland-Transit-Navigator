/**
 * Created by jamesonnyeholt2 on 8/18/14.
 */

'use strict';
angular.module('pdxStreetcarApp')

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

    .controller('MainCtrl', function ($scope, $log, $location, geolocation, timeCalcService) {

        // Variables
        $scope.showStreetcarServiceWarning = false;
        $scope.streetcarScheduleMessage = "";

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

        determineIfServiceIsAvailable();
    });
