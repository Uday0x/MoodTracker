function getPollStatus(poll) {
  if (poll.published) return 'published';
  return poll.expiresAt.getTime() <= Date.now() ? 'expired' : 'active';
}

function serializePoll(poll, includeAnalytics = false) {
  const payload = {
    id: poll.publicId,
    title: poll.title,
    description: poll.description,
    responseMode: poll.responseMode,
    expiresAt: poll.expiresAt,
    published: poll.published,
    publishedAt: poll.publishedAt,
    createdAt: poll.createdAt,
    status: getPollStatus(poll),
    questions: poll.questions.map((question) => ({
      id: question._id.toString(),
      text: question.text,
      required: question.required,
      options: question.options.map((option) => ({
        id: option._id.toString(),
        text: option.text
      }))
    }))
  };

  if (includeAnalytics) payload.analytics = buildAnalytics(poll);
  return payload;
}

function buildAnalytics(poll) {
  const responses = poll.responses || [];
  const questions = poll.questions.map((question) => {
    const options = question.options.map((option) => ({
      id: option._id.toString(),
      text: option.text,
      count: 0,
      percentage: 0
    }));

    let answered = 0;
    for (const response of responses) {
      const answer = response.answers.find((candidate) => candidate.questionId.toString() === question._id.toString());
      if (!answer) continue;
      answered += 1;
      const option = options.find((candidate) => candidate.id === answer.optionId.toString());
      if (option) option.count += 1;
    }

    for (const option of options) {
      option.percentage = answered ? Math.round((option.count / answered) * 100) : 0;
    }

    return {
      id: question._id.toString(),
      text: question.text,
      required: question.required,
      answered,
      skipped: responses.length - answered,
      options
    };
  });

  const authenticatedResponses = responses.filter((response) => response.respondent).length;

  return {
    pollId: poll.publicId,
    title: poll.title,
    totalResponses: responses.length,
    authenticatedResponses,
    anonymousResponses: responses.length - authenticatedResponses,
    status: getPollStatus(poll),
    expiresAt: poll.expiresAt,
    published: poll.published,
    questions,
    recentResponses: responses.slice(-5).reverse().map((response) => ({
      id: response._id.toString(),
      createdAt: response.submittedAt,
      respondent: response.respondent ? 'Authenticated participant' : 'Anonymous participant'
    }))
  };
}

module.exports = { getPollStatus, serializePoll, buildAnalytics };
