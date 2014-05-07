'use strict';

describe('Controller: PrimaryviewCtrl', function () {

  // load the controller's module
  beforeEach(module('pdxStreetcarApp'));

  var PrimaryviewCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PrimaryviewCtrl = $controller('PrimaryviewCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
