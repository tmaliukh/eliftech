import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  value: mongoose.Schema.Types.Mixed
});

const responseSchema = new mongoose.Schema({
  questionnaireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Questionnaire',
    required: true
  },
  answers: [answerSchema],
  completionTime: {
    type: Number, 
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Response', responseSchema); 