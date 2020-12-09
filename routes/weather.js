const express = require('express');
const router = express.Router();
const fetch = require('node-fetch')

const baseUrl = 'https://api.openweathermap.org/data/2.5/weather?units=metric'
const appid = '3a8e27db2f53d5233b5e559948a133b6'

router.get('/city', (req, res, next) => {
    const city = req.query.q;
    const lang = req.query.lang;
    fetch(`${baseUrl}&appid=${appid}&q=${city}&lang=${lang}`)
        .then(r => r.json())
        .then(r => {
            console.log(r);
            res.status(200).json(r);
        })
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
        .then(r => {
            console.log(r);
            res.status(200).json(r);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

module.exports = router;
