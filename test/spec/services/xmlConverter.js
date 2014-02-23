'use strict';

describe('Service: Xmlconverter', function () {

  // load the service's module
  beforeEach(module('PdxstreetcarApp'));

  // instantiate service
  var Xmlconverter;
  beforeEach(inject(function (_Xmlconverter_) {
    Xmlconverter = _Xmlconverter_;
  }));

  it('should do something', function () {
    expect(!!Xmlconverter).toBe(true);
  });

});
