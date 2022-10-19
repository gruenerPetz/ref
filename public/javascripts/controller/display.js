angular.module('refApp', [
  'btford.socket-io'
]).factory('socket', function (socketFactory) {
  return socketFactory();
}).controller('DisplayController', function ($scope, $http, $interval, socket) {
  let timerInterval;
  let audio = new Audio('sounds/beep.mp3');
  $scope.showResult = false;
  $scope.remoteController = [];
  $scope.weight = null;
  $scope.attempt = null;
  $scope.time = null;

  $http.get('/config').then(function(res){
    $scope.remoteController = res.data.remoteController;
    $scope.weight = res.data.weight;
    $scope.attempt = res.data.attempt;
    $scope.time = formatTime(res.data.time);
  });

  socket.on("connect", function () {
    socket.emit('client.new', { "view": "Display", "path": "/display" });
  });

  socket.on("client.path", function (path) {
    window.location = path;
  });

  socket.on('remoteController.update', function (controllers) {
    $scope.remoteController = controllers;
  });

  socket.on('display.showResult', function (data) {
    $scope.showResult = data;
  });

  socket.on("time.start", function (data) {
    var time = data;
    $interval.cancel(timerInterval);
    $scope.time = formatTime(time);
    timerInterval = $interval(function () {
      $scope.time = formatTime(--time);
      // if (time == 60 || time == 30)
      // {
      //   audio.play();
      // }

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

  socket.on("attempt.set", function (data) {
    $scope.attempt = data;
  });

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
