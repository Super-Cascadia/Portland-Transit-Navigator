'use strict';

angular.module('pdxStreetcarApp')
  .controller('TrimetviewCtrl', function ($scope, trimet) {
        $scope.map = {
            center: {
                latitude: 45,
                longitude: -73
            },
            zoom: 18
        };
        function initState() {
            $scope.routeIsSelected = false;
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
        }
        function getRailRoutes() {
            trimet.rail.getRoutes(function getSuccess(response) {
                $scope.routes = response.resultSet.route;
                $scope.selectRoute($scope.routes[0]);
            }, function getError(response) {

            });
        }
        function getStreetcarRoutes() {
            trimet.streetcar.getRoutes(function getSuccess(response) {
                $scope.routes = response.resultSet.route;
                $scope.selectRoute($scope.routes[0]);
            }, function getError(response) {

            });
        }
        function getArrivals(stop) {
            trimet.getArrivalsForStop(stop, function arrivalSuccess(arrivalInfo) {
                $scope.selectedStop.arrivalInfo = arrivalInfo;
                $scope.queryTime = arrivalInfo.resultSet.queryTime;
            }, function arrivalError(response) {

            });
        }
        function initTrimet() {
            initState();
            getStreetcarRoutes();
            return getRailRoutes();
        }
        $scope.returnToAllStops = function () {
            $scope.stopIsSelected = false;
            $scope.selectedStop = null;
        };
        $scope.selectStop = function (stop) {
            console.log(stop);
            $scope.stopIsSelected = true;
            $scope.selectedStop = stop;
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
