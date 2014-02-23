'use strict';

angular.module('pdxStreetcarApp')
  .controller('topNavigationCtrl', function ($scope, $routeParams, $route, $location) {

    $scope.topNavigationItems = [
        {
            displayName: "Home",
            route: "/"
        },
        {
            displayName: "Street Car",
            route: "/streetcar"
        },
        {
            displayName: "TriMet",
            route: "/trimet"
        },
        {
            displayName: "Bus",
            route: "/bus"
        }
    ];

    $scope.topNavItemClick = function (navItem) {
        console.log(navItem);
    };

    $scope.isActive = function (navItem) {
        if (navItem.route === $route.current.$$route.originalPath) {
            return true;
        } else {
            return false;
        }
    };
  });
