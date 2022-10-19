angular.module('refApp', [
  'btford.socket-io'
]).factory('socket', function (socketFactory) {
  return socketFactory();
}).controller('WeightController', function ($scope, $http, $interval, socket) {
  let timerInterval;

  $scope.time = formatTime(0);
  $scope.weight = 0;
  $scope.weightError = false;
  $scope.attempt = 0;
  $scope.controllers = [];
  $scope.clients = [];
  $scope.discs = [];

  $scope.getNumber = function(num) {
    let result = [];

    for (let i=0; i<num; i++) {
      result.push(i);
    }

    return result;
  };

  $http.get('/config').then(function(res){
    $scope.controllers = res.data.controllers;
    $scope.time = formatTime(res.data.time);
    $scope.weight = res.data.weight;
    $scope.weightError = res.data.weightError;
    $scope.attempt = res.data.attempt;
    $scope.discs = res.data.discs;
  });

  socket.on("connect", function () {
    socket.emit('client.new', { "view": "Weight", "path": "/weight" });
  });

  socket.on("client.path", function (path) {
    window.location = path;
  });

  socket.on("time.start", function (data) {
    let time = data;
    $interval.cancel(timerInterval);
    $scope.time = formatTime(time);
    timerInterval = $interval(function () {
      $scope.time = formatTime(--time);
      if (time === 60 || time === 30)
      {
        audio.play();
      }

      if (time === 0) {
        $interval.cancel(timerInterval);
      }
    }, 1000);
  });

  socket.on("time.reset", function (data) {
    $interval.cancel(timerInterval);
    $scope.time = formatTime(data);
  });

  socket.on("weight.set", function (data) {
    $scope.weight = data;
  });

  socket.on("discs.set", function (data) {
    $scope.weightError = !!data.exception;
    $scope.discs = data;
  });

  socket.on("attempt.set", function (data) {
    $scope.attempt = data;
  });

  function formatTime(time) {
    let sec_num = parseInt(time, 10);
    let hours = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (minutes < 10) {
      minutes = "0" + minutes;
    }

    if (seconds < 10) {
      seconds = "0" + seconds;
    }

    return minutes + ':' + seconds;
  }
});
