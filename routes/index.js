let express = require('express');
let router = express.Router();
let _ = require("underscore");
let os = require('os');
const socketManager = require("../socketManager");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const db = low(new FileSync('db.json'));
const bcrypt = require('bcrypt');

router.use((req, res, next) => {
    const settings = db.get('settings').find({
        id: "adminPassword"
    }).value();

    if (settings.value === '' && req.originalUrl !== '/install') {
        res.redirect("/install");
    }

    next();
})

router.get('/install', function (req, res, next) {
    res.render('install', {
        title: "Install"
    });
});
router.post('/install', function (req, res, next) {
    if (req.body.adminPassword) {
        bcrypt.hash(req.body.adminPassword, 10, function(err, hash) {
            db.get('settings').find({
                id: "adminPassword"
            }).assign({
                value: hash,
            }).write();

            res.redirect("/");
        });
    } else {
        res.redirect("/install");
    }
});

router.get('/', function (req, res, next) {
    res.render('index', {
        title: "Index"
    });
});

router.get('/break', function (req, res, next) {
    res.render('break', {
        title: "Break",
        time: socketManager.time
    });
});

router.get('/display', function (req, res, next) {
    res.render('display', {
        title: "Display",
        time: socketManager.time,
        weight: socketManager.weight,
        attempt: socketManager.attempt
    });
});

router.get('/weight', function (req, res, next) {
    console.log({
        title: "Weight",
        time: socketManager.time,
        weight: socketManager.weight,
        weightError: socketManager.weightError,
        attempt: socketManager.attempt
    });
    res.render('weight', {
        title: "Weight",
        time: socketManager.time,
        weight: socketManager.weight,
        weightError: socketManager.weightError,
        attempt: socketManager.attempt
    });
});

router.get('/ip', function (req, res, next) {
    let ifaces = os.networkInterfaces();
    let ip;

    Object.keys(ifaces).forEach(function (ifname) {
        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            ip = iface.address;
        });
    });

    res.setHeader('Content-Type', 'application/json');

    res.send(JSON.stringify({
        ip: ip
    }))
});

module.exports = router;
