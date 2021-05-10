var express = require('express');
var router = express.Router();
const path = require('path');
const kaltura = require('kaltura-client');
//var KalturaClientFactory = require('../lib/kalturaClientFactory');

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    res.render('index', { title: 'Kaltura Node Template' });

  } catch (e) {
    res.render('error', { message: e, error: e });
  }
});

router.get('/*', async function (req, res, next) {
  try {
    res.render(path.parse(req.path).name);
  } catch (e) {
    res.render('error', { message: e, error: e });
  }
});


module.exports = router;
