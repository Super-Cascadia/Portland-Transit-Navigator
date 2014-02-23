'use strict';

describe('Controller: TrimetviewCtrl', function () {

  // load the controller's module
  beforeEach(module('pdxStreetcarApp'));

  var TrimetviewCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TrimetviewCtrl = $controller('TrimetviewCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
