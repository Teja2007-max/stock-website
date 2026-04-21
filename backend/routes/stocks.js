const express = require('express');
const router = express.Router();
const { getStockData, getTrendingOptions, getFullHistory, getIndices, getCompanyDetails, getSectorHeatmap, getScreener } = require('../controllers/stockController');
const { optionalProtect } = require('../middleware/authMiddleware');

router.get('/trending', getTrendingOptions);
router.get('/indices', getIndices);
router.get('/sectors', getSectorHeatmap);
router.get('/screener', getScreener);
router.get('/:symbol/fullhistory', getFullHistory);
router.get('/:symbol/details', getCompanyDetails);
router.get('/:symbol', optionalProtect, getStockData);

module.exports = router;
