const express = require("express");
const router = express.Router();
const socketManager = require("../socketManager");
const _ = require("underscore");
const auth = require('basic-auth');
const bcrypt = require('bcrypt');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const db = low(new FileSync('db.json'));

function checkUser(req) {
    const settings = db.get('settings').find({
        id: "adminPassword"
    }).value();

    const admins = {admin: {password: settings.value}};

    return new Promise((resolve, reject) => {
        let user = auth(req);

        if (user && admins[user.name]) {
            bcrypt.compare(user.pass, admins[user.name].password).then((result) => {
                if (result) {
                    resolve();
                } else {
                    reject();
                }
            })
        } else {
            reject();
        }
    });
}

router.get("/", function (req, res, next) {
    checkUser(req).then(() => {
        res.render("settings");
    }).catch(() => {
        res.set('WWW-Authenticate', 'Basic realm="example"');
        return res.status(401).send()
    });
});

router.put("/remoteController/:remoteControllerId", function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(socketManager.updateRemoteController(req.body)));
});

module.exports = router;
