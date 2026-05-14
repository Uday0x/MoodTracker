const express = require('express');
const {
  createPoll,
  getAnalytics,
  getPublicPoll,
  listPolls,
  publishResults,
  submitResponse
} = require('../controllers/pollController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listPolls);
router.post('/', requireAuth, createPoll);
router.get('/:pollId', getPublicPoll);
router.post('/:pollId/responses', submitResponse);
router.get('/:pollId/analytics', requireAuth, getAnalytics);
router.post('/:pollId/publish', requireAuth, publishResults);

module.exports = router;
