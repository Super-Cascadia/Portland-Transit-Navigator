'use strict';

angular.module('pdxStreetcarApp')

    .service('Navigator', function (RouteData, $log, $q) {
        var self = this;

        function retrieveRoutesData(target) {
            var routes;

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

        self.toggleDirection = function (target, route) {

            var routeId = route.routeId,
                directionId = route.directionId,
                foundRoute,
                routes;

            function toggleRouteDirectionDisplay(r) {

                var direction = r.directions[directionId];

                if (direction.enabled === false) {
                    RouteData.showRouteLayer(routeId, direction.directionId);
                    routes[routeId].enabled = true;
                    direction.enabled = true;
                } else if (direction.enabled === true) {
                    RouteData.hideRouteLayer(routeId, direction.directionId);
                    routes[routeId].enabled = false;
                    direction.enabled = false;
                }
            }

            routes = retrieveRoutesData(target);
            foundRoute = _.find(routes, {'routeId': routeId});

            toggleRouteDirectionDisplay(foundRoute);
            syncRoutesData(routes, target);

            return routes;
        };

        self.selectRoute = function (target, route) {

            var routeId = route.routeId,
                foundRoute,
                routes;

            function showBothRouteDirections(r) {
                var deferred = $q.defer();

                if (!r.enabled) {
                    r.enabled = true;
                    if (r.directions) {
                        if (r.directions[0]) {
                            r.directions[0].enabled = true;
                            RouteData.showRouteLayer(r.routeId, r.directions[0].directionId);
                        }
                        if (r.directions[1]) {
                            r.directions[1].enabled = true;
                            RouteData.showRouteLayer(r.routeId, r.directions[1].directionId);
                        }
                        deferred.resolve();
                    }
                } else {
                    $log.warn('Route: ' + route.routeId + ' is already enabled.');
                    deferred.resolve();
                }
                return deferred.promise;
            }

            routes = retrieveRoutesData(target);
            foundRoute = _.find(routes, {'routeId': routeId});

            showBothRouteDirections(foundRoute)
                .then(function () {
                    return syncRoutesData(routes, target);
                })
                .then(function () {
                    return RouteData.zoomMapToFitRoute(routeId);
                });

            return routes;
        };

        self.toggleRoute = function (target, route) {

            var routeId = route.routeId,
                foundRoute,
                routes;

            routes = retrieveRoutesData(target);
            foundRoute = _.find(routes, {'routeId': routeId});

            syncRoutesData(routes, target);

            return routes;

        };
    });



