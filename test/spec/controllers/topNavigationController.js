'use strict';

describe('Controller: TopnavigationcontrollerCtrl', function () {

  // load the controller's module
  beforeEach(module('pdxStreetcarApp'));

  var TopnavigationcontrollerCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TopnavigationcontrollerCtrl = $controller('TopnavigationcontrollerCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
