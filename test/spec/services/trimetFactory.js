'use strict';

describe('Service: Trimetfactory', function () {

  // load the service's module
  beforeEach(module('PdxstreetcarApp'));

  // instantiate service
  var Trimetfactory;
  beforeEach(inject(function (_Trimetfactory_) {
    Trimetfactory = _Trimetfactory_;
  }));

  it('should do something', function () {
    expect(!!Trimetfactory).toBe(true);
  });

});
