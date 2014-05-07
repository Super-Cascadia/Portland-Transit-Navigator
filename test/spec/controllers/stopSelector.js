'use strict';

describe('Controller: StopselectorCtrl', function () {

  // load the controller's module
  beforeEach(module('pdxStreetcarApp'));

  var StopselectorCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    StopselectorCtrl = $controller('StopselectorCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
