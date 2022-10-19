const express = require("express");
const router = express.Router();
const socketManager = require("../socketManager");
const _ = require("underscore");
const auth = require('basic-auth');
const bcrypt = require('bcrypt');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const db = low(new FileSync('db.json'));

async function comparePassword(dbPassword, password) {
    return await bcrypt.compare(password, user.passwordHash);
}

router.get("/", function (req, res, next) {
    let user = auth(req);

    const settings = db.get('settings').find({
        id: "adminPassword"
    }).value();

    const admins = {admin: {password: settings.value}};

    if (!user || !admins[user.name] || !comparePassword(admins[user.name].password, user.pass)) {
        res.set('WWW-Authenticate', 'Basic realm="example"');
        return res.status(401).send()
    }

    res.render("settings");
});

router.put("/remoteController/:remoteControllerId", function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(socketManager.updateRemoteController(req.body)));
});

module.exports = router;
