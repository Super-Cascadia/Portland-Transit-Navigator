'use strict';
angular.module('pdxStreetcarApp')
    .factory('trimetFactory', function ($http, xmlConverter) {
        // Service logic
        var trimetAppId = "F3757A12A14F88550C14A9A2B";
        var baseUrl = 'http://developer.trimet.org/ws/V1/';
        var trimetURL;

        function getArrivals(success, error) {
            var locIDs = ['2580'];
            trimetURL = baseUrl + 'arrivals/json/true/locIDs/' + locIDs[0] + '/appID/' + trimetAppId;
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
            getArrivals: function (success, error) {
                return getArrivals(success, error);
            },
            getRoutes: function (success, error) {
                return getRoutes(success, error);
            }
        };
    });
