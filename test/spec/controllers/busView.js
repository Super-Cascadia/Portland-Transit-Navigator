'use strict';

describe('Controller: BusviewCtrl', function () {

  // load the controller's module
  beforeEach(module('pdxStreetcarApp'));

  var BusviewCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BusviewCtrl = $controller('BusviewCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
