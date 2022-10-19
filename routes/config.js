let express = require('express');
let router = express.Router();
let socketManager = require("../socketManager");
let _ = require("underscore");

router.get('/', function (req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    remoteController: socketManager.remoteController,
    discs: socketManager.discs,
    time: socketManager.time,
    weight: socketManager.weight,
    weightError: socketManager.weightError,
    attempt: socketManager.attempt
  }))
});

router.get('/remoteController/:token', function (req, res, next) {
  let remoteController = _.find(socketManager.remoteController, function(remoteController){
    return remoteController.token === req.params.token;
  });

  res.setHeader('Content-Type', 'application/json');

  if (remoteController) {
    res.send(JSON.stringify({
      success: true,
      remoteController: remoteController
    }))
  } else {
    res.send(JSON.stringify({
      success: false
    }))
  }
});

router.post("/discs", function (req, res, next) {
  socketManager.discs = req.body;
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(socketManager.discs))
});

module.exports = router;
