const crypto = require('crypto');
const mongoose = require('mongoose');
const Poll = require('../models/Poll');
const { buildAnalytics, getPollStatus, serializePoll } = require('../services/analyticsService');
const { emitPollAnalytics } = require('../socket');

function createPublicId() {
  return crypto.randomBytes(9).toString('base64url');
}

function validatePollInput(body) {
  const errors = [];
  if (!body.title || body.title.trim().length < 3) errors.push('Title must be at least 3 characters.');
  if (!['anonymous', 'authenticated'].includes(body.responseMode)) errors.push('Choose anonymous or authenticated response mode.');
  if (!body.expiresAt || Number.isNaN(new Date(body.expiresAt).getTime())) errors.push('A valid expiry date and time is required.');
  if (body.expiresAt && new Date(body.expiresAt).getTime() <= Date.now()) errors.push('Expiry time must be in the future.');
  if (!Array.isArray(body.questions) || body.questions.length === 0) errors.push('Add at least one question.');

  (body.questions || []).forEach((question, index) => {
    if (!question.text || question.text.trim().length < 3) errors.push(`Question ${index + 1} needs meaningful text.`);
    if (!Array.isArray(question.options) || question.options.length < 2) errors.push(`Question ${index + 1} needs at least two options.`);
    (question.options || []).forEach((option, optionIndex) => {
      const text = typeof option === 'string' ? option : option.text;
      if (!text || text.trim().length === 0) errors.push(`Option ${optionIndex + 1} for question ${index + 1} cannot be blank.`);
    });
  });

  return errors;
}

function validateAnswers(poll, answers) {
  const errors = [];
  if (!Array.isArray(answers)) return ['Answers must be provided as an array.'];
  const answerMap = new Map(answers.map((answer) => [String(answer.questionId), String(answer.optionId)]));

  for (const question of poll.questions) {
    const questionId = question._id.toString();
    const selected = answerMap.get(questionId);

    if (!selected) {
      if (question.required) errors.push(`Question "${question.text}" is required.`);
      continue;
    }

    if (!question.options.some((option) => option._id.toString() === selected)) {
      errors.push(`Question "${question.text}" has an invalid option selected.`);
    }
  }

  return errors;
}

async function listPolls(req, res, next) {
  try {
    const polls = await Poll.find({ creator: req.user._id }).sort({ createdAt: -1 });
    return res.json({
      polls: polls.map((poll) => ({
        ...serializePoll(poll),
        totalResponses: poll.responses.length
      }))
    });
  } catch (error) {
    return next(error);
  }
}

async function createPoll(req, res, next) {
  try {
    const errors = validatePollInput(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    const poll = await Poll.create({
      publicId: createPublicId(),
      creator: req.user._id,
      title: req.body.title.trim(),
      description: String(req.body.description || '').trim(),
      responseMode: req.body.responseMode,
      expiresAt: new Date(req.body.expiresAt),
      questions: req.body.questions.map((question) => ({
        text: question.text.trim(),
        required: Boolean(question.required),
        options: question.options.map((option) => ({ text: (typeof option === 'string' ? option : option.text).trim() }))
      }))
    });

    return res.status(201).json({ poll: serializePoll(poll) });
  } catch (error) {
    return next(error);
  }
}

async function getPublicPoll(req, res, next) {
  try {
    const poll = await Poll.findOne({ publicId: req.params.pollId });
    if (!poll) return res.status(404).json({ error: 'Poll not found.' });

    const isCreator = req.user && poll.creator.toString() === req.user._id.toString();
    // Include analytics if: published OR creator OR poll is active (accepting responses)
    const status = getPollStatus(poll);
    const includeAnalytics = poll.published || isCreator || status === 'active';
    return res.json({ poll: serializePoll(poll, includeAnalytics) });
  } catch (error) {
    return next(error);
  }
}

async function submitResponse(req, res, next) {
  try {
    const poll = await Poll.findOne({ publicId: req.params.pollId });
    if (!poll) return res.status(404).json({ error: 'Poll not found.' });
    if (poll.published) return res.status(400).json({ error: 'This poll has been published and no longer accepts responses.' });
    if (getPollStatus(poll) === 'expired') return res.status(400).json({ error: 'This poll has expired and is no longer accepting responses.' });
    if (poll.responseMode === 'authenticated' && !req.user) return res.status(401).json({ error: 'Please log in to answer this authenticated poll.' });
    if (req.user && poll.responses.some((response) => response.respondent && response.respondent.toString() === req.user._id.toString())) {
      return res.status(409).json({ error: 'You have already submitted a response for this poll.' });
    }

    const errors = validateAnswers(poll, req.body.answers);
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    const answerMap = new Map(req.body.answers.map((answer) => [String(answer.questionId), String(answer.optionId)]));
    poll.responses.push({
      respondent: req.user ? req.user._id : null,
      answers: poll.questions
        .filter((question) => answerMap.has(question._id.toString()))
        .map((question) => ({
          questionId: new mongoose.Types.ObjectId(question._id),
          optionId: new mongoose.Types.ObjectId(answerMap.get(question._id.toString()))
        }))
    });

    await poll.save();
    await emitPollAnalytics(poll.publicId);
    return res.status(201).json({ message: 'Response submitted successfully.', analytics: buildAnalytics(poll) });
  } catch (error) {
    return next(error);
  }
}

async function getAnalytics(req, res, next) {
  try {
    const poll = await Poll.findOne({ publicId: req.params.pollId });
    if (!poll) return res.status(404).json({ error: 'Poll not found.' });
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the poll creator can view this analytics dashboard.' });
    }
    return res.json({ analytics: buildAnalytics(poll) });
  } catch (error) {
    return next(error);
  }
}

async function publishResults(req, res, next) {
  try {
    const poll = await Poll.findOne({ publicId: req.params.pollId });
    if (!poll) return res.status(404).json({ error: 'Poll not found.' });
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the poll creator can publish results.' });
    }

    poll.published = true;
    poll.publishedAt = new Date();
    await poll.save();
    await emitPollAnalytics(poll.publicId);
    return res.json({ poll: serializePoll(poll, true) });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPolls,
  createPoll,
  getPublicPoll,
  submitResponse,
  getAnalytics,
  publishResults
};
