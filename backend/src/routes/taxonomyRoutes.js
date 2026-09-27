const express = require('express');
const router = express.Router();
const taxonomyController = require('../controllers/taxonomyController');

router.get('/', taxonomyController.getTaxonomy);
router.get('/:slug', taxonomyController.getTaxonomyLanding);

module.exports = router;
