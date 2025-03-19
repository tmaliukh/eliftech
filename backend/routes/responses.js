import express from 'express';
import Response from '../models/Response.js';
import Questionnaire from '../models/Questionnaire.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { questionnaireId, answers, completionTime } = req.body;
    console.log(' answers:', answers);

    if (!questionnaireId || !answers || !Array.isArray(answers) || typeof completionTime !== 'number') {
      return res.status(400).json({ 
        message: 'Questionnaire ID, answers array, and completion time are required' 
      });
    }

    const questionnaire = await Questionnaire.findById(questionnaireId);
    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    if (answers.length !== questionnaire.questions.length) {
      return res.status(400).json({ 
        message: `Expected ${questionnaire.questions.length} answers, got ${answers.length}` 
      });
    }

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const question = questionnaire.questions[i];

      if (!answer.questionId || answer.questionId.toString() !== question._id.toString()) {
        return res.status(400).json({ 
          message: `Invalid question ID for answer ${i + 1}` 
        });
      }

      switch (question.type) {
        case 'text':
          console.log(111, answer.value)
          if (typeof answer.value[0] !== 'string' || answer.value[0].trim() === '') {
            return res.status(400).json({ 
              message: `Text answer required for question ${i + 1}` 
            });
          }
          break;

        case 'single_choice':
          if (!question.options.includes(answer.value)) {
            return res.status(400).json({ 
              message: `Invalid option for question ${i + 1}` 
            });
          }
          break;

        case 'multiple_choice':
          if (!Array.isArray(answer.value) || answer.value.length === 0) {
            return res.status(400).json({ 
              message: `At least one option required for question ${i + 1}` 
            });
          }
          for (const option of answer.value) {
            if (!question.options.includes(option)) {
              return res.status(400).json({ 
                message: `Invalid option for question ${i + 1}` 
              });
            }
          }
          break;
      }
    }

    const response = new Response({
      questionnaireId,
      answers,
      completionTime
    });

    const savedResponse = await response.save();
    res.status(201).json(savedResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/questionnaire/:questionnaireId', async (req, res) => {
  try {
    const responses = await Response.find({
      questionnaireId: req.params.questionnaireId
    }).sort({ createdAt: -1 });

    res.json(responses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats/:questionnaireId', async (req, res) => {
  try {
    const responses = await Response.find({
      questionnaireId: req.params.questionnaireId
    });

    const questionnaire = await Questionnaire.findById(req.params.questionnaireId);
    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    const stats = {
      totalResponses: responses.length,
      averageCompletionTime: responses.reduce((acc, curr) => acc + curr.completionTime, 0) / responses.length || 0,
      questionStats: questionnaire.questions.map(question => {
        const questionResponses = responses.map(response => {
          const answer = response.answers.find(a => a.questionId.toString() === question._id.toString());
          return answer ? answer.value : null;
        }).filter(Boolean);

        let answerDistribution = {};
        if (question.type === 'multiple_choice') {
          questionResponses.forEach(answers => {
            answers.forEach(answer => {
              answerDistribution[answer] = (answerDistribution[answer] || 0) + 1;
            });
          });
        } else {
          questionResponses.forEach(answer => {
            answerDistribution[answer] = (answerDistribution[answer] || 0) + 1;
          });
        }

        return {
          questionId: question._id,
          questionText: question.text,
          type: question.type,
          answerDistribution
        };
      })
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 