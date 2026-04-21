const express = require('express');
const router = express.Router();
const { getNews, getNewsCategories } = require('../controllers/newsController');

router.get('/categories', getNewsCategories);
router.get('/', getNews);

module.exports = router;
