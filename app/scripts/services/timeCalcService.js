'use strict';
angular.module('pdxStreetcarApp')
    .factory('timeCalcService', function ($q, $log) {
        // Variables
        var streetCarOperatingHours;

        // Utility Functions
        function getNewDate(params) {
            return moment(params);
        }

        streetCarOperatingHours = [
            {
                name: 'sunday',
                daysOfWeek: [0],
                startTime: getNewDate("January 1, 2014 07:30:00"),
                endTime: getNewDate("January 1, 2014 22:30:00")
            },
            {
                name: 'weekdays',
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: getNewDate("January 1, 2014 05:30:00"),
                endTime: getNewDate("January 1, 2014 22:30:00")
            },
            {
                name: 'saturday',
                daysOfWeek: [6],
                startTime: getNewDate("January 1, 2014 07:30:00"),
                endTime: getNewDate("January 1, 2014 22:30:00")
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

        function calculateRelativeTimes(arrivalInfo, queryTime) {
            var deferred = $q.defer(),
                arrivals = arrivalInfo.resultSet.arrival;
                arrivals = sortArrivalsArrayByDate(arrivals);
                _.forEach(arrivals, function (currentArrival, index, array) {
                    calculateDifferenceInTimes(currentArrival, queryTime)
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
                            $log.error("Could not calculate the difference in times.");
                            deferred.reject();
                        });
                });
            return deferred.promise;
        }

        function isStreetCarOutOfService() {
            var deferred = $q.defer(),
                currentDate,
                weekdayNumber,
                currentDayOperatingSchedule,
                currentTime;
            currentDate = moment();
            weekdayNumber = currentDate.getDay();
            currentTime = currentDate.getTime();

            function findScheduleForTodaysDate() {
                _.forEach(streetCarOperatingHours, function (schedule, index, array) {
                    return _.find(schedule.daysOfWeek, function (dayNumber) {
                        if (dayNumber === weekdayNumber) {
                            currentDayOperatingSchedule = schedule;
                            return currentDayOperatingSchedule;
                        }
                    });
                });
            }

            function determineIfCurrentTimeIsInRange() {
                currentTime.diff(currentDayOperatingSchedule);
            }

            findScheduleForTodaysDate();
            determineIfCurrentTimeIsInRange();
            return deferred.promise;
        }


        // Public API here
        return {
            calculateRelativeTimes: function (arrivalInfo, queryTime) {
                return calculateRelativeTimes(arrivalInfo, queryTime);
            },
            calculateDifferenceInTimes: function (arrival, queryTime) {
                return calculateDifferenceInTimes(arrival, queryTime);
            },
            isStreetCarOutOfService: function () {
                return isStreetCarOutOfService();
            }
        };
    });
