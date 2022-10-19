angular.module('refApp', [
  'btford.socket-io'
]).factory('socket', function (socketFactory) {
  return socketFactory();
}).directive('onLongPress', function($timeout) {
  return {
    restrict: 'A',
    link: function($scope, $elm, $attrs) {
      $elm.bind('mousedown', function(evt) {
        // Locally scoped variable that will keep track of the long press
        $scope.longClicking = true;

        // We'll set a timeout for 600 ms for a long press
        $timeout(function() {
          if ($scope.longClicking) {
            $scope.longClick = true;
            // If the touchend event hasn't fired,
            // apply the function given in on the element's on-long-press attribute
            $scope.$apply(function() {
              $scope.$eval($attrs.onLongClick)
            });
          }
        }, 600);
      });

      $document.bind('mouseup', function(evt) {
        // Prevent the onLongPress event from firing
        $scope.longClicking = false;
        if ($scope.longClick) {
          $scope.longClick = false;
          // If there is an on-touch-end function attached to this element, apply it
          if ($attrs.onLongClickRelease) {
            $scope.$apply(function() {
              $scope.$eval($attrs.onLongClickRelease)
            });
          }
        }
      });
    }
  };
}).controller('RemoteController', function ($scope, $http, $timeout) {
  $scope.remoteController = remoteController;

  $scope.sendCode = function (remoteController, button) {
    button.status = 'loading';
    $http.post('/remote/' + remoteController.token + '/' + button.code).then(function(res){
      if(res.data.success) {
        button.status = 'success';
        $timeout(function () {
          button.status = 'ready';
        }, 500);
      } else {
        button.status = 'error';
        $timeout(function () {
          button.status = 'ready';
        }, 1000);
      }
    });
  };

  $scope.logout = function () {
    localStorage.clear();
    $scope.remoteController = null;
  };

  function setRemoteControllerToken (token) {
    $http.get('/config/remoteController/' + token).then(function(res){
      if (res.data.success) {
        $scope.remoteController = res.data.remoteController;
        localStorage.setItem('remoteControllerToken', token);
      }
    });
  }
});
