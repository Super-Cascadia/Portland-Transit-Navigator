'use strict';

angular.module('pdxStreetcarApp')
  .controller('TrimetviewCtrl', function ($scope, $http, xmlConverter, trimetFactory) {
        $scope.map = {
            center: {
                latitude: 45,
                longitude: -73
            },
            zoom: 20
        };
        function initState() {
            $scope.routeIsSelected = false;
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
        }
        function getRoutes() {
            trimetFactory.getRoutes(function getSuccess(response) {
                $scope.routes = response.resultSet.route;
                $scope.selectRoute($scope.routes[0]);
            }, function getError(response) {

            });
        }
        function getArrivals(stop) {
            trimetFactory.getArrivalsForStop(stop, function arrivalSuccess(arrivalInfo) {
                $scope.selectedStop.arrivalInfo = arrivalInfo;
                $scope.queryTime = arrivalInfo.resultSet.queryTime;
            }, function arrivalError(response) {

            });
        }
        function initTrimet() {
            initState();
            return getRoutes();
        }
        $scope.returnToAllStops = function () {
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
        };
        $scope.selectStop = function (stop) {
            console.log(stop);
            $scope.stopIsSelected = true;
            $scope.selectedStop = stop;
            $scope.map = {
                center: {
                    latitude: stop.lat,
                    longitude: stop.lng
                },
                draggable: true,
                zoom: 20
            };
            getArrivals(stop);
        };
        $scope.isRouteSelected = function (route) {
            if ($scope.selectedRoute) {
                return route.route === $scope.selectedRoute.route;
            }
        };
        $scope.selectRoute = function (route) {
            $scope.selectedRoute = route;
            $scope.routeIsSelected = true;
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
        };
        $scope.refreshArrivals = function (stop) {
            getArrivals(stop);
        };
        return initTrimet();
  });
