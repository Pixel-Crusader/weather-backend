const express = require('express');
const router = express.Router();
const Datastore = require('nedb')

const favDb = new Datastore({ filename: './favorites.db', autoload: true });
const usersDb = new Datastore( { filename: './users.db', autoload: true });

router.get('/', (req, res, next) => {
    const userId = req.cookies.userId;
    if (!userId) {
        return res.status(200).json([])
    }
    favDb.find({}, (error, docs) => {
        if (error) {
            console.log(error);
        }
        else {
            console.log(docs);
        }
    });
    res.cookie('userId', userId, { maxAge: 3600000 * 24 * 180 })
    res.status(200).json({
        message: "Get favorites for user " + userId
    });
});

router.post('/', async (req, res, next) => {
    let userId
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
    res.cookie('userId', userId, { maxAge: 3600000 * 24 * 180 })
    console.log(req.body.name);
    res.status(201).json({name: req.body.name});
})

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