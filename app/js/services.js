/**
 * Created by jamesonnyeholt2 on 9/4/14.
 */

angular.module('pdxStreetcarApp')

    .factory('feetToMeters', function (distanceConversions) {
    "use strict";
    return function (feet) {
        return feet * distanceConversions.FEET_TO_METERS;
    };
})

    .factory('timeCalcService', function ($q, $log) {
        // Variables
        var streetCarOperatingHours;

        // Utility Functions
        function getNewDate(hour, minute) {
            var constructedDate;
            constructedDate = moment();
            constructedDate.hours(hour);
            constructedDate.minutes(minute);
            return constructedDate;
        }

        streetCarOperatingHours = [
            {
                name: 'sunday',
                daysOfWeek: [0],
                startTime: getNewDate(7, 30),
                endTime: getNewDate(23, 30)
            },
            {
                name: 'weekdays',
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: getNewDate(5, 30),
                endTime: getNewDate(23, 30)
            },
            {
                name: 'saturday',
                daysOfWeek: [6],
                startTime: getNewDate(7, 30),
                endTime: getNewDate(23, 30)
            }

        ];

        // Service logic
        function getTimeDifference(earlierDate, laterDate) {
            var deferred = $q.defer(),
                nTotalDiff = laterDate.getTime() - earlierDate.getTime(),
                oDiff = new Object();
            oDiff.days = Math.floor(nTotalDiff / 1000 / 60 / 60 / 24);
            nTotalDiff -= oDiff.days * 1000 * 60 * 60 * 24;
            oDiff.hours = Math.floor(nTotalDiff / 1000 / 60 / 60);
            nTotalDiff -= oDiff.hours * 1000 * 60 * 60;
            oDiff.minutes = Math.floor(nTotalDiff / 1000 / 60);
            nTotalDiff -= oDiff.minutes * 1000 * 60;
            oDiff.seconds = Math.floor(nTotalDiff / 1000);
            if (oDiff) {
                deferred.resolve(oDiff);
            } else {
                deferred.reject();
            }
            return deferred.promise;
        }

        function calculateDifferenceInTimes(arrival, queryTime) {
            var estimatedArrivalTime,
                deferred = $q.defer(),
                queryTimeDateObject;
            if (arrival.estimated) {
                estimatedArrivalTime = new Date(arrival.estimated);
            } else {
                estimatedArrivalTime = new Date(arrival.scheduled);
            }
            queryTimeDateObject = new Date(queryTime);
            getTimeDifference(queryTimeDateObject, estimatedArrivalTime)
                .then(function (diff) {
                    deferred.resolve(diff);
                }, function () {
                    deferred.reject();
                });
            return deferred.promise;
        }

        function sortArrivalsArrayByDate(arrivals) {
            arrivals.sort(function (a, b) {
                var keyA = new Date(a.estimated),
                    keyB = new Date(b.estimated);
                if (keyA < keyB) {
                    return -1;
                }
                if (keyA > keyB) {
                    return 1;
                }
                return 0;
            });
            return arrivals;
        }

        function calculateRelativeTimes(arrivalInfo) {
            var deferred = $q.defer(),
                arrivals = arrivalInfo.resultSet.arrival;
            arrivals = sortArrivalsArrayByDate(arrivals);
            _.forEach(arrivals, function (currentArrival, index, array) {
                calculateDifferenceInTimes(currentArrival, arrivalInfo.resultSet.queryTime)
                    .then(function (remainingTime) {
                        if (remainingTime.days < 1 && remainingTime.hours < 1) {
                            if (remainingTime.minutes <= 3) {
                                currentArrival.imminent = true;
                            } else if (remainingTime.minutes <= 6) {
                                currentArrival.soon = true;
                            } else if (remainingTime.minutes <= 15) {
                                currentArrival.enoughTimeForCoffee = true;
                            } else if (remainingTime.minutes >= 16) {
                                currentArrival.aGoodAmountofTime = true;
                            }
                        } else {
                            currentArrival.justWalk = true;
                        }
                        currentArrival.remainingTime = remainingTime;
                        if ((index + 1) === array.length) {
                            deferred.resolve(arrivalInfo);
                        }
                    }, function () {
                        $log.error('Could not calculate the difference in times.');
                        deferred.reject();
                    });
            });
            return deferred.promise;
        }

        function isStreetCarOutOfService() {
            var deferred = $q.defer(),
                currentDate,
                currentDay,
                operatingSchedule;
            currentDate = moment();
            currentDay = currentDate.day();

            function findScheduleForTodaysDate() {
                _.forEach(streetCarOperatingHours, function (schedule, index, array) {
                    return _.find(schedule.daysOfWeek, function (dayNumber) {
                        if (dayNumber === currentDay) {
                            operatingSchedule = schedule;
                            return operatingSchedule;
                        }
                    });
                });
            }

            function currentTimeAfterStartTime(differenceInTime) {
                if (differenceInTime > 0) {
                    return true;
                }
            }

            function currentTimeBeforeEndTime(differenceInTime) {
                if (differenceInTime < 0) {
                    return true;
                }
            }

            function determineIfCurrentTimeIsInRange() {
                var differenceToStartTime,
                    differenceToEndTime;
                differenceToStartTime = currentDate.diff(operatingSchedule.startTime, 'minutes');
                differenceToEndTime = currentDate.diff(operatingSchedule.endTime, 'minutes');
                if (currentTimeAfterStartTime(differenceToStartTime)) {
                    if (currentTimeBeforeEndTime(differenceToEndTime)) {
                        deferred.resolve(differenceToStartTime, differenceToEndTime);
                    }
                } else {
                    if (currentTimeBeforeEndTime(differenceToEndTime)) {
                        deferred.reject(differenceToStartTime, differenceToEndTime);
                    }
                }
            }

            findScheduleForTodaysDate();
            determineIfCurrentTimeIsInRange();
            return deferred.promise;
        }


        // Public API here
        return {
            calculateRelativeTimes: calculateRelativeTimes,
            calculateDifferenceInTimes: function (arrival, queryTime) {
                return calculateDifferenceInTimes(arrival, queryTime);
            },
            isStreetCarOutOfService: function () {
                return isStreetCarOutOfService();
            }
        };
    })

    .factory('formatRetrievedRoutes', function () {
        "use strict";
        return function (data) {
            var result = {};
            _.forEach(data.resultSet.route, function (route) {
                var routeId = route.route;
                var template = {
                    name: route.desc,
                    detour: route.detour,
                    routeId: routeId,
                    type: route.type,
                    directions: {}
                };

                _.forEach(route.dir, function (direction) {
                    var directionId = direction.dir;
                    if (!template.directions[directionId]) {
                        template.directions[directionId] = {
                            routeId: routeId,
                            directionId: directionId,
                            stops: direction.stop || [],
                            displayName: direction.desc || route.desc,
                            enabled: false
                        };
                    }
                });

                result[routeId] = template;
            });
            return result;
        };
    })

    .factory('trimetUtilities', function () {

        function isStreetCarRoute (arrival) {
            return _.contains([193, 194], arrival.route);
        }

        function isTrimetRoute (arrival) {
            return _.contains([100,200,90,190], arrival.route);
        }

        return {
            isStreetCarRoute: isStreetCarRoute,
            isTrimetRoute: isTrimetRoute
        };
    });
