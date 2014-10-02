/**
 * Created by jamesonnyeholt2 on 9/4/14.
 */

angular.module('pdxStreetcarApp')

    .service('ArrivalData', function (trimet, timeCalcService) {
        var self = this;

        self.getArrivalsForStop = function (locId) {
            return trimet.getArrivalsForStop(locId)
                .then(function (data) {
                    if (data.resultSet.arrival) {
                        data = timeCalcService.calculateRelativeTimes(data);
                    }
                    return data;
                });
        };
    });
