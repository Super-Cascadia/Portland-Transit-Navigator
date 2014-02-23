'use strict';

angular.module('pdxStreetcarApp')
  .controller('TrimetviewCtrl', function ($scope, $http, xmlConverter, trimetFactory) {

        $scope.routeIsSelected = false;


        $scope.isSelected = function (route) {
            if ($scope.selectedRoute) {
                if (route.route === $scope.selectedRoute.route) {
                    return true;
                } else {
                    return false;
                }
            }
        };

        $scope.selectRoute = function (route) {
            $scope.selectedRoute = route;
            $scope.routeIsSelected = true;
        };

        function getRoutes() {
            trimetFactory.getRoutes(function getSuccess(response) {
                $scope.routes = response.resultSet.route;
            }, function getError(response) {

            });
        }

        function initTrimet() {
            return getRoutes();
        }

        return initTrimet();
  });
