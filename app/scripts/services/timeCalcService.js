'use strict';
angular.module('pdxStreetcarApp')
    .factory('timeCalcService', function ($q, $log) {
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
                queryTimeDateObject = new Date(queryTime);
            if (arrival.estimated) {
                estimatedArrivalTime = new Date(arrival.estimated);
            } else {
                estimatedArrivalTime = new Date(arrival.scheduled);
            }
            getTimeDifference(queryTimeDateObject, estimatedArrivalTime)
                .then(function (diff) {
                    deferred.resolve(diff);
                }, function () {
                    deferred.reject();
                });
            return deferred.promise;
        }

        function calculateRelativeTimes(arrivalInfo) {
            var deferred = $q.defer(),
                arrivals = arrivalInfo.resultSet.arrival,
                currentArrival,
                i;

            function calcTimeDiff(currentArrival) {
                calculateDifferenceInTimes(currentArrival)
                    .then(function (remainingTime) {
                        deferred.resolve(remainingTime);
                    }, function () {
                        $log.error("Could not calculate the difference in times.");
                        deferred.reject();
                    });
            }

            for (i = 0; i < arrivals.length; i += 1) {
                currentArrival = arrivals[i];
                calcTimeDiff(currentArrival);
            }
            return deferred.promise;
        }
        // Public API here
        return {
            calculateRelativeTimes: function (arrivalInfo) {
                return calculateRelativeTimes(arrivalInfo);
            },
            calculateDifferenceInTimes: function (arrival, queryTime) {
                return calculateDifferenceInTimes(arrival, queryTime);
            }
        };
    });
