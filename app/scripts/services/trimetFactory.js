'use strict';
angular.module('pdxStreetcarApp')
    .factory('trimetFactory', function ($http, xmlConverter) {
        // Service logic
        var trimetAppId = "F3757A12A14F88550C14A9A2B";
        var baseUrl = 'http://developer.trimet.org/ws/V1/';
        var trimetURL;
        function getArrivals(stop, success, error) {
            var locID = stop.locid;
            trimetURL = baseUrl + 'arrivals/json/true/streetcar/true/locIDs/' + locID + '/appID/' + trimetAppId;
            $http({
                method: 'GET',
                url: trimetURL,
                responseType: 'xml',
                headers: {
                    'Accept': 'application/xml, text/xml, */*; q=0.01'
                }
            }).
            success(function (data, status, headers, config) {
                success(data);
            }).
            error(function (data, status, headers, config) {
                error(data);
            });
        }
        function getRoutes(success, error) {
            trimetURL = baseUrl + 'routeConfig/json/true/routes/100,200,90,190/stops/tp/dir/appID/' + trimetAppId;
            $http({
                method: 'GET',
                url: trimetURL,
                responseType: 'xml',
                headers: {
                    'Accept': 'application/xml, text/xml, */*; q=0.01'
                }
            }).
                success(function (data, status, headers, config) {
                    success(data);
                }).
                error(function (data, status, headers, config) {
                    error();
                });
        }
        // Public API here
        return {
            getArrivalsForStop: function (stop, success, error) {
                return getArrivals(stop, success, error);
            },
            getRoutes: function (success, error) {
                return getRoutes(success, error);
            }
        };
    });
