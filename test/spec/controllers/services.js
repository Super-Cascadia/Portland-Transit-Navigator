'use strict';
describe('Factory: trimetUtilities', function () {

  var trimetUtilities;

  beforeEach(function () {
    module('pdxStreetcarApp');
  });

  beforeEach(inject(function (_trimetUtilities_) {
    trimetUtilities = _trimetUtilities_;
  }));

  describe('#trimetUtilities.isStreetCarRoute', function () {

    describe('called with a valid set of data', function () {

      it('should return true', inject(function (trimetUtilities) {

        var arrival = {};

        arrival.route = 193;

        var result = trimetUtilities.isStreetCarRoute(arrival);

        expect(result).toBe(true);

      }));

      it('should return true', inject(function (trimetUtilities) {

        var arrival = {};

        arrival.route = 194;

        var result = trimetUtilities.isStreetCarRoute(arrival);

        expect(result).toBe(true);

      }));

    });

    describe('called with a invalid set of data', function () {

      it('should return true', inject(function (trimetUtilities) {

        var arrival = {};

        arrival.route = 400;

        var result = trimetUtilities.isStreetCarRoute(arrival);

        expect(result).toBe(false);

      }));

    });

  });

  describe('#trimetUtilities.isTrimetRoute', function () {

    describe('called with a valid set of data', function () {

      it('should return true', inject(function (trimetUtilities) {

        var arrival = {};

        arrival.route = 100;

        var result = trimetUtilities.isTrimetRoute(arrival);

        expect(result).toBe(true);

      }));

      it('should return true', inject(function (trimetUtilities) {

        var arrival = {};

        arrival.route = 200;

        var result = trimetUtilities.isTrimetRoute(arrival);

        expect(result).toBe(true);

      }));

      it('should return true', inject(function (trimetUtilities) {

        var arrival = {};

        arrival.route = 90;

        var result = trimetUtilities.isTrimetRoute(arrival);

        expect(result).toBe(true);

      }));

      it('should return true', inject(function (trimetUtilities) {

        var arrival = {};

        arrival.route = 190;

        var result = trimetUtilities.isTrimetRoute(arrival);

        expect(result).toBe(true);

      }));

    });

    describe('called with a invalid set of data', function () {

      it('should return true', inject(function (trimetUtilities) {

        var arrival = {};

        arrival.route = 400;

        var result = trimetUtilities.isTrimetRoute(arrival);

        expect(result).toBe(false);

      }));

    });

  });

});
