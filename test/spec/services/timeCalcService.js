'use strict';

describe('Service: Timecalcservice', function () {

  // load the service's module
  beforeEach(module('PdxstreetcarApp'));

  // instantiate service
  var Timecalcservice;
  beforeEach(inject(function (_Timecalcservice_) {
    Timecalcservice = _Timecalcservice_;
  }));

  it('should do something', function () {
    expect(!!Timecalcservice).toBe(true);
  });

});
