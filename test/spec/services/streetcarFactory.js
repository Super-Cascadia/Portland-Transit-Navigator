'use strict';

describe('Service: Streetcarfactory', function () {

  // load the service's module
  beforeEach(module('PdxstreetcarApp'));

  // instantiate service
  var Streetcarfactory;
  beforeEach(inject(function (_Streetcarfactory_) {
    Streetcarfactory = _Streetcarfactory_;
  }));

  it('should do something', function () {
    expect(!!Streetcarfactory).toBe(true);
  });

});
