'use strict';

describe('Controller: StreetcarviewCtrl', function () {

  // load the controller's module
  beforeEach(module('pdxStreetcarApp'));

  var StreetcarviewCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    StreetcarviewCtrl = $controller('StreetcarviewCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
