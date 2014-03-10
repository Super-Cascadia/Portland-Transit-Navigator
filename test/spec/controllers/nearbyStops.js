'use strict';

describe('Controller: NearbystopsCtrl', function () {

  // load the controller's module
  beforeEach(module('pdxStreetcarApp'));

  var NearbystopsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    NearbystopsCtrl = $controller('NearbystopsCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
