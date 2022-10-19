const express = require('express');
const router = express.Router();
const socketManager = require("../socketManager");
const _ = require("underscore");

router.get('/', function (req, res, next) {
  res.render('remote-login');
});

router.post('/', function (req, res, next) {
  let remoteController = _.find(socketManager.remoteController, function (remoteController) {
    return remoteController.token === parseInt(req.body.token);
  });

  if (!remoteController) {
    return res.redirect('/remote');
  }

  return res.redirect('/remote/' + req.body.token);
});

router.get('/:token', function (req, res, next) {
  let remoteController = _.find(socketManager.remoteController, function (remoteController) {
    return remoteController.token === parseInt(req.params.token);
  });

  if (!remoteController) {
    res.redirect('/remote');
  }

  res.render('remote', {
    remoteController: remoteController
  });
});

//api endpoint for app controller - get controller
router.get('/app/:token', function (req, res, next) {
  let remoteController = _.find(socketManager.remoteController, function (remoteController) {
    return remoteController.token === parseInt(req.params.token);
  });

  if (!remoteController) {
    res.status(403).send({msg: 'Falscher Auth-Token'});
  }

  res.json({remoteController: remoteController});
});

router.post('/:token/:code', function (req, res) {
  let remoteController = _.find(socketManager.remoteController, function (remoteController) {
    return remoteController.token === parseInt(req.params.token);
  });

  if (!remoteController) {
    return res.redirect('/remote');
  }

  socketManager.setRemoteControllerCode(remoteController, parseInt(req.params.code));

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    success: true
  }))
});

module.exports = router;
