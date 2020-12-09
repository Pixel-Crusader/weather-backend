const express = require('express');
const router = express.Router();
const Datastore = require('nedb');

const favDb = new Datastore({ filename: './favorites.db', autoload: true });
favDb.ensureIndex({ fieldName: ['compound'], unique: true }, err => {});
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
            console.log(docs);
            res.status(200).json(docs);
        }
    });
});

router.post('/', async (req, res, next) => {
    const cityName = req.body.name;
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
    favDb.insert({ user: userId, city: cityName, compound: userId+cityName }, (err, doc) => {
        if (err) {
            if (err.errorType === 'uniqueViolated') {
                res.status(409).json();
            }
            else {
                res.status(500).json({ error: err });
            }
        }
        else {
            res.status(201).json({ cityName: doc.city });
        }
    });
});

router.delete('/', (req, res, next) => {
    const cityName = req.body.name;
    if (!cityName) {
        return res.status(400).json();
    }
    const userId = req.cookies.userId;
    if (!userId) {
        return res.status(401).json();
    }
    res.cookie('userId', userId, { maxAge: 3600000 * 24 * 180 });
    favDb.remove({ city: cityName, user: userId }, (err, num) => {
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