const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Option text is required.'],
      trim: true,
      maxlength: [160, 'Option text cannot exceed 160 characters.']
    }
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required.'],
      trim: true,
      minlength: [3, 'Question text must be at least 3 characters.'],
      maxlength: [240, 'Question text cannot exceed 240 characters.']
    },
    required: {
      type: Boolean,
      default: true
    },
    options: {
      type: [optionSchema],
      validate: {
        validator(options) {
          return Array.isArray(options) && options.length >= 2;
        },
        message: 'Each question needs at least two options.'
      }
    }
  },
  { _id: true }
);

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    respondent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    answers: {
      type: [answerSchema],
      default: []
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const pollSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Poll title is required.'],
      trim: true,
      minlength: [3, 'Poll title must be at least 3 characters.'],
      maxlength: [120, 'Poll title cannot exceed 120 characters.']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters.'],
      default: ''
    },
    responseMode: {
      type: String,
      enum: ['anonymous', 'authenticated'],
      required: true,
      default: 'anonymous'
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry time is required.'],
      index: true
    },
    published: {
      type: Boolean,
      default: false
    },
    publishedAt: {
      type: Date,
      default: null
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator(questions) {
          return Array.isArray(questions) && questions.length > 0;
        },
        message: 'Add at least one question.'
      }
    },
    responses: {
      type: [responseSchema],
      default: []
    }
  },
  { timestamps: true }
);

pollSchema.index({ creator: 1, createdAt: -1 });
pollSchema.index({ publicId: 1 }, { unique: true });
pollSchema.index({ expiresAt: 1, published: 1 });

pollSchema.virtual('status').get(function getStatus() {
  if (this.published) return 'published';
  return this.expiresAt.getTime() <= Date.now() ? 'expired' : 'active';
});

module.exports = mongoose.model('Poll', pollSchema);
