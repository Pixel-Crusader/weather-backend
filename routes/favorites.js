const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const DbHelper = require('./dbHelper');

const baseUrl = process.env.BASE_URL;
const appid = process.env.APP_ID;
const db = new DbHelper();


router.get('/', (req, res, next) => {
    const userId = req.cookies.userId;
    if (!userId) {
        return res.status(200).json([]);
    }
    res.cookie('userId', userId, { maxAge: 3600000 * 24 * 180 });
    db.getAll(userId)
        .then(result => res.status(200).json(result))
        .catch(err => res.status(500).json(err));
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
        if (!await db.validateId(userId)) {
            userId = await db.getId();
        }
    }
    else {
        userId = await db.getId();
    }
    res.cookie('userId', userId, { maxAge: 3600000 * 24 * 180 });
    db.insert(userId, cityName, cityId).then(inserted => {
        if (!inserted) {
            res.status(409).json({ name: cityName });
        }
        else {
            res.status(201).json(response);
        }
    })
        .catch(err => res.status(500).json(err));
});

router.delete('/', async (req, res, next) => {
    const cityName = req.query.name;
    if (!cityName) {
        return res.status(400).json({});
    }
    const userId = req.cookies.userId;
    if (!userId) {
        return res.status(401).json();
    }
    let cityId;
    const response = await fetch(`${baseUrl}&appid=${appid}&q=${encodeURI(cityName)}`).then(r => r.json());
    if (response.cod !== 200) {
        return res.status(response.cod).json({});
    }
    else {
        cityId = response.id;
    }
    res.cookie('userId', userId, { maxAge: 3600000 * 24 * 180 });
    db.delete(userId, cityId)
        .then(num => res.status(200).json({ removed: num }))
        .catch(err => res.status(500).json(err));
});


module.exports = router;