const express = require('express');
const router = express.Router();
const fetch = require('node-fetch')

const baseUrl = process.env.BASE_URL
const appid = process.env.APP_ID

router.get('/city', (req, res, next) => {
    const city = req.query.q;
    if (!city) {
        return res.status(400).json();
    }
    const lang = req.query.lang;
    fetch(`${baseUrl}&appid=${appid}&q=${encodeURI(city)}&lang=${lang}`)
        .then(r => r.json())
        .then(r => res.status(r.cod).json(r))
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.get('/coordinates', (req, res, next) => {
    const lat = req.query.lat;
    const long = req.query.long;
    const lang = req.query.lang;
    fetch(`${baseUrl}&appid=${appid}&lat=${lat}&lon=${long}&lang=${lang}`)
        .then(r => r.json())
        .then(r => res.status(r.cod).json(r))
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

module.exports = router;
