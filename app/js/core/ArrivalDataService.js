/**
 * Created by jamesonnyeholt2 on 9/4/14.
 */

angular.module('pdxStreetcarApp')

    .service('ArrivalData', function (trimet, timeCalcService) {
        var self = this;

        self.getArrivalsForStop = function (stopMarker) {
            return trimet.getArrivalsForStop(stopMarker.stopMetaData.locid)
                .then(function (data) {
                    return timeCalcService.calculateRelativeTimes(data, data.resultSet.queryTime);
                });
        };
    });
