angular.module('refApp', [
  'btford.socket-io'
]).factory('socket', function (socketFactory) {
  return socketFactory();
}).controller('SettingsController', function ($scope, $http, $interval, socket) {
  let timerInterval;
  let startTime;
  $scope.time = formatTime(0);
  $scope.weight = 0;
  $scope.attempt = 0;
  $scope.remoteController = [];
  $scope.clients = [];
  $scope.discs = [];

  $http.get('/config').then(function(res){
    $scope.remoteController = res.data.remoteController;
    $scope.time = formatTime(res.data.time);
    $scope.weight = res.data.weight;
    $scope.weightError = false;
    $scope.attempt = res.data.attempt;
    $scope.discs = res.data.discs;
  });

  socket.on("connect", function () {
    socket.emit('client.new', { "view": "Settings", "path": "/settings" });
  });

  socket.on("client.path", function (path) {
    window.location = path;
  });

  socket.on('clients', function (data) {
    $scope.clients = data;
  });

  socket.on('remoteController.update', function (remoteController) {
    $scope.remoteController = remoteController;
  });

  socket.on("discs.set", function (data) {
    $scope.weightError = !!data.exception;
  });

  $scope.startTime = function () {
    if (timerInterval) {
      $interval.cancel(timerInterval);
      $scope.time = formatTime(toSeconds(startTime));
      socket.emit('time.reset', toSeconds(startTime));
    }

    let time = toSeconds($scope.time);
    startTime = time;
    $scope.time = formatTime(toSeconds(time));
    timerInterval = $interval(function () {
      $scope.time = formatTime(--time);
      if (time === 0) {
        $interval.cancel(timerInterval);
      }
    }, 1000);
    socket.emit('time.start', toSeconds($scope.time));
  };

  $scope.resetTime = function () {
    if (timerInterval) {
      $interval.cancel(timerInterval);
      $scope.time = formatTime(toSeconds(startTime));
      socket.emit('time.reset', toSeconds(startTime));
    }
  };

  $scope.setWeight = function (weight) {
    socket.emit('weight.set', weight);
  };

  $scope.saveDiscs = function () {
    $http.post('/config/discs', $scope.discs).then(function(res){
      $scope.discs = res.data;
      $("#weightSettingsModal").modal('hide');
    });
  };

  $scope.setAttempt = function (attempt) {
    $scope.attempt = attempt;
    socket.emit('attempt.set', attempt);
  };

  $scope.updatePath = function (client) {
    socket.emit('client.path', {
      id: client.id,
      path: client.path
    });
  };

  $scope.updateRemoteControllerToken = function (remoteController) {
    remoteController.token = Math.floor(Math.random()*9000) + 1000;
    $http.put('/settings/remoteController/' + remoteController.id, remoteController).then(function(res){
      $scope.settings.remoteController = res.data;
    });
  };

  $scope.sendCode = function (remoteController, button) {
    socket.emit('code', parseInt(String(remoteController.token) + String(button.code)));
  };

  function toSeconds(time) {
    var p = time.toString().split(':'),
      seconds = 0;

    if (p.length > 2) {
      alert("Invalid time (hh:mm:ss)");
    } else if (p.length === 2) {
      seconds = (p[0] * 60) + (p[1] * 1);
    } else {
      seconds = (p[0] * 1);
    }

    return seconds;
  }

  function formatTime(time) {
    var sec_num = parseInt(time, 10);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    if (seconds < 10) {
      seconds = "0" + seconds;
    }

    return minutes + ':' + seconds;
  }
});
