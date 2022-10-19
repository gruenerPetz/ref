"use strict";

let events = require('events');
let EventEmitter = events.EventEmitter;
let _ = require("underscore");
let low = require('lowdb');
let FileSync = require('lowdb/adapters/FileSync');

let db = low(new FileSync('db.json'));

db.defaults({
  settings: [
    {
      id: "adminPassword",
      value: ""
    }
  ],
  remoteController: [
    {
      id: "left",
      token: Math.floor(Math.random() * 9000) + 1000,
      title: "LEFT",
      received: false,
      valid: false,
      buttons: {
        10: {
          id: "white",
          code: 10,
          buttonClass: "btn-default",
          buttonText: "White",
          active: false
        },
        20: {
          id: "red",
          code: 20,
          buttonClass: "btn-danger",
          buttonText: "Red",
          active: false
        },
        30: {
          id: "blue",
          code: 30,
          buttonClass: "btn-primary",
          buttonText: "Blue",
          active: false
        },
        40: {
          id: "yellow",
          code: 40,
          buttonClass: "btn-warning",
          buttonText: "Yellow",
          active: false
        }
      },
      optionButtons: []
    },
    {
      id: "center",
      token: Math.floor(Math.random() * 9000) + 1000,
      title: "CENTER",
      received: false,
      valid: false,
      buttons: {
        10: {
          id: "white",
          code: 10,
          buttonClass: "btn-default",
          buttonText: "White",
          active: false
        },
        20: {
          id: "red",
          code: 20,
          buttonClass: "btn-danger",
          buttonText: "Red",
          active: false
        },
        30: {
          id: "blue",
          code: 30,
          buttonClass: "btn-primary",
          buttonText: "Blue",
          active: false
        },
        40: {
          id: "yellow",
          code: 40,
          buttonClass: "btn-warning",
          buttonText: "Yellow",
          active: false
        }
      },
      optionButtons: [{
        id: "reset",
        code: 50,
        buttonClass: "btn-default",
        buttonText: "RESET"
      }, {
        id: "start",
        code: 60,
        buttonClass: "btn-default",
        buttonText: "START"
      }]
    },
    {
      id: "right",
      token: Math.floor(Math.random() * 9000) + 1000,
      title: "RIGHT",
      received: false,
      valid: false,
      buttons: {
        10: {
          id: "white",
          code: 10,
          buttonClass: "btn-default",
          buttonText: "White",
          active: false
        },
        20: {
          id: "red",
          code: 20,
          buttonClass: "btn-danger",
          buttonText: "Red",
          active: false
        },
        30: {
          id: "blue",
          code: 30,
          buttonClass: "btn-primary",
          buttonText: "Blue",
          active: false
        },
        40: {
          id: "yellow",
          code: 40,
          buttonClass: "btn-warning",
          buttonText: "Yellow",
          active: false
        }
      },
      optionButtons: []
    }
  ]
}).write();


var socketManager = {
  eventManager: new EventEmitter(),
  clients: {},
  time: 60,
  weight: 0,
  weightError: false,
  attempt: 1,
  lock: false,
  maxWeight: 0,
  bar: 25,
  discs: [{
    weight: 50,
    max: 0,
    count: 0
  }, {
    weight: 25,
    max: 16,
    count: 0
  }, {
    weight: 20,
    max: 2,
    count: 0
  }, {
    weight: 15,
    max: 2,
    count: 0
  }, {
    weight: 10,
    max: 2,
    count: 0
  }, {
    weight: 5,
    max: 2,
    count: 0
  }, {
    weight: 2.5,
    max: 2,
    count: 0
  }, {
    weight: 1.25,
    max: 2,
    count: 0
  }, {
    weight: 0.5,
    max: 4,
    count: 0
  }, {
    weight: 0.25,
    max: 2,
    count: 0
  }],

  init: function (server) {
    this.remoteController = db.get('remoteController').value();
    this.socket = require("socket.io")(server);
    this.socket.on("connection", function (socket) {
      socket.on("client.new", function (client) {
        this.addClient(socket, client);
      }.bind(this));

      socket.on("client.path", function (data) {
        var client = _.find(this.clients, function (client) {
          return client.id === data.id;
        });

        if (client) {
          client.socket.emit("client.path", data.path);
          console.log("client.path", data.path);
        }
      }.bind(this));

      socket.on("disconnect", function () {
        this.removeClient(socket);
      }.bind(this));

      socket.on("time.start", function (time) {
        this.time = time;
        this.socket.emit("time.start", time);
        console.log("time.start", time);
      }.bind(this));

      socket.on("time.reset", function (time) {
        this.time = time;
        this.socket.emit("time.reset", time);
        console.log("time.reset", time);
      }.bind(this));

      socket.on("weight.set", function (weight) {
        console.log("weight.set", weight);
        this.weight = weight;
        this.calculateDiscs(weight);
        this.socket.emit("weight.set", weight);
      }.bind(this));

      socket.on("attempt.set", function (attempt) {
        this.attempt = attempt;
        this.socket.emit("attempt.set", attempt);
        console.log("attempt.set", attempt);
      }.bind(this));

      socket.on("code", function (token) {
        this.setRemoteControllerCode(token);
      }.bind(this));

      this.eventManager.on("controller.token", function (token) {
        this.setRemoteControllerCode(token);
      }.bind(this));
    }.bind(this));
  },

  addClient: function (socket, client) {
    var socketId = socket.id;

    this.clients[socketId] = {
      "id": socketId,
      "view": client.view,
      "path": client.path,
      "socket": socket
    };

    this.socket.emit("clients", _.map(this.clients, function (client) {
      return {
        "id": client.id,
        "view": client.view,
        "path": client.path
      };
    }));

    console.log("a client connected: " + socketId);
  },

  removeClient: function (socket) {
    var socketId = socket.id;

    delete this.clients[socketId];

    this.socket.emit("clients", _.map(this.clients, function (client) {
      return {
        "id": client.id,
        "view": client.view,
        "path": client.path
      };
    }));

    console.log("a client disconnected: " + socketId);
  },

  setRemoteControllerCode: function (remoteController, buttonCode) {
    if (remoteController) {
      console.log(buttonCode);

      if (buttonCode === 50) {

        this.socket.emit("time.reset", 60);

        socketManager.remoteController = _.map(socketManager.remoteController, function (controller) {
          controller.valid = false;
          controller.received = false;
          controller.buttons[10].active = false;
          controller.buttons[20].active = false;
          controller.buttons[30].active = false;
          controller.buttons[40].active = false;

          this.lock = false;
          console.log(buttonCode);
          return controller;
        }.bind(this));
      } else if (buttonCode === 60) {
        this.socket.emit("time.start", 60);
      } else if (!this.lock) {
        remoteController.received = true;
        remoteController.valid = false;
        remoteController.buttons[buttonCode].active = true;

        if (buttonCode === 10) {
          remoteController.valid = true;
          remoteController.buttons[20].active = false;
          remoteController.buttons[30].active = false;
          remoteController.buttons[40].active = false;
        }
      }
    }

    this.socket.emit("remoteController.update", socketManager.remoteController);
    this.showResult();
  },

  updateRemoteController: function (remoteController) {
    socketManager.remoteController = _.map(socketManager.remoteController, function (socketManagerRemoteController) {
      if (remoteController.id === socketManagerRemoteController.id) {
        socketManagerRemoteController = remoteController;
      }
      return socketManagerRemoteController;
    });

    db.get('remoteController').find({id: remoteController.id}).assign(remoteController).write();

    return socketManager.remoteController;
  },

  showResult: function () {
    let received = 0;

    _.each(socketManager.remoteController, function (remoteController) {
      if (remoteController.received === true) {
        received++;
      }
    });

    if (received === 3) {
      this.lock = true;
      this.socket.emit("display.showResult", true);
    } else {
      this.lock = false;
      this.socket.emit("display.showResult", false);
    }
  },

  calculateDiscs: function (weight) {
    socketManager.maxWeight = socketManager.bar;

    _.each(socketManager.discs, function (disc) {
      disc.count = 0;

      socketManager.maxWeight += disc.max * disc.weight;
    });

    let side = (weight - socketManager.bar) / 2;

    console.log("Max wight: " + socketManager.maxWeight);

    if (socketManager.maxWeight < weight) {
      return;
    }

    _.map(socketManager.discs, function (disc) {
      if (side >= disc.weight && disc.max > 0) {
        let count = Math.floor(side / disc.weight);
        if (count <= (disc.max / 2)) {
          disc.count = count;
          side = side % disc.weight;
        }
      }
    });

    if (side === 0) {
      socketManager.weightError = false;
      this.socket.emit("discs.set", socketManager.discs);
    } else {
      socketManager.weightError = true;
      this.socket.emit("discs.set", {
        "exception" : "Invalid input data"
      });
    }
  }
};

module.exports = socketManager;
