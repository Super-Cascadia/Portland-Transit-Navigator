'use strict';

angular.module('pdxStreetcarApp')

    .service('Navigator', function (RouteData) {
        var self = this;

        self.toggleRoute = function (target, route) {

            var routeId = route.routeId,
                directionId = route.directionId,
                foundRoute,
                routes;

            function retrieveRoutesData(target) {
                if (target === 'streetcar') {
                    routes = RouteData.streetcarData;
                } else if (target === 'trimet') {
                    routes = RouteData.maxRailData;
                } else if (target === 'bus') {
                    routes = RouteData.busRoutesData;
                }
                return routes;
            }

            function syncRoutesData(data, target) {
                if (target === 'streetcar') {
                    RouteData.streetcarData = data;
                } else if (target === 'trimet') {
                    RouteData.maxRailData = data;
                } else if (target === 'bus') {
                    RouteData.busRoutesData = data;
                }
            }

            function toggleRoute(foundRoute) {

                var direction = _.find(foundRoute.directions, {'directionId': directionId});

                if (direction.enabled === false) {
                    RouteData.overwriteRouteLayerOnMap(routeId, direction.directionId);
                    routes[routeId].enabled = true;
                    direction.enabled = true;
                } else if (direction.enabled === true) {
                    RouteData.clearRouteLayersOnMap(routeId, direction.directionId);
                    routes[routeId].enabled = false;
                    direction.enabled = false;
                }
            }

            routes = retrieveRoutesData(target);
            foundRoute = _.find(routes, {"routeId": routeId});

            toggleRoute(foundRoute);
            syncRoutesData(routes, target);

            return routes;
        };
    });



