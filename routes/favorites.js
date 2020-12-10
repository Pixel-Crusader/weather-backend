const express = require('express');
const router = express.Router();
const fetch = require('node-fetch')
const Datastore = require('nedb');

const baseUrl = process.env.BASE_URL
const appid = process.env.APP_ID

const favDb = new Datastore({ filename: './favorites.db', autoload: true });
favDb.ensureIndex({ fieldName: 'compound', unique: true }, err => {});
const usersDb = new Datastore( { filename: './users.db', autoload: true });

router.get('/', (req, res, next) => {
    const userId = req.cookies.userId;
    if (!userId) {
        return res.status(200).json([]);
    }
    res.cookie('userId', userId, { maxAge: 3600000 * 24 * 180 });
    favDb.find({ user: userId }, { city: 1, _id: 0 }, (error, docs) => {
        if (error) {
            console.log(error);
            res.status(500).json(error);
        }
        else {
            res.status(200).json(docs);
        }
    });
});

router.post('/', async (req, res, next) => {
    let cityName = req.body.name;
    if (!cityName) {
        return res.status(400).json({});
    }
    let lang = req.body.lang;
    if (!lang) {
        lang = 'en'
    }
    let cityId;
    const response = await fetch(`${baseUrl}&appid=${appid}&lang=${lang}&q=${encodeURI(cityName)}`).then(r => r.json());
    if (response.cod !== 200) {
        return res.status(response.cod).json({});
    }
    else {
        cityId = response.id;
        cityName = response.name;
    }
    let userId;
    if (req.cookies.userId) {
        userId = req.cookies.userId;
        if (!await validateId(userId)) {
            userId = await getId();
        }
    }
    else {
        userId = await getId();
        console.log(userId);
    }
    res.cookie('userId', userId, { maxAge: 3600000 * 24 * 180 });
    favDb.insert({ user: userId, city: cityName, compound: userId+cityId }, (err, doc) => {
        if (err) {
            if (err.errorType === 'uniqueViolated') {
                res.status(409).json({ name: cityName });
            }
            else {
                res.status(500).json({ error: err });
            }
        }
        else {
            res.status(201).json(response);
        }
    });
});

router.delete('/', async (req, res, next) => {
    let cityName = req.query.name;
    if (!cityName) {
        return res.status(400).json({});
    }
    let cityId;
    const response = await fetch(`${baseUrl}&appid=${appid}&q=${encodeURI(cityName)}`).then(r => r.json());
    if (response.cod !== 200) {
        return res.status(response.cod).json({});
    }
    else {
        cityId = response.id;
    }
    const userId = req.cookies.userId;
    if (!userId) {
        return res.status(401).json();
    }
    res.cookie('userId', userId, { maxAge: 3600000 * 24 * 180 });
    favDb.remove({ compound: userId+cityId }, (err, num) => {
        if (err) {
            res.status(500).json(err);
        }
        else {
            res.status(200).json({ removed: num });
        }
    })
});

function validateId(id) {
    return new Promise((resolve, reject) => {
        usersDb.find({ _id: id }, (err, docs) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                resolve(docs.length !== 0);
            }
        })
    })
}

function getId() {
    return new Promise((resolve, reject) => {
        usersDb.insert({}, (err, doc) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                resolve(doc._id);
            }
        })
    });
}

module.exports = router;