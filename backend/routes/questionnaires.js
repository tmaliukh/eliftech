import express from 'express';
import Questionnaire from '../models/Questionnaire.js';
import Response from '../models/Response.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const questionnaires = await Questionnaire.find()
    .sort({ number: 1 })
    .skip(skip)
      .limit(limit);
    
    const questionnairesWithCounts = await Promise.all(
      questionnaires.map(async (questionnaire) => {
        const completionCount = await Response.countDocuments({
          questionnaireId: questionnaire._id
        });
        return {
          ...questionnaire.toObject(),
          completionCount,
          questionCount: questionnaire.questions.length
        };
      })
    );

    const total = await Questionnaire.countDocuments();
    res.json({
      questionnaires: questionnairesWithCounts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }
    res.json(questionnaire);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    console.log(222, req.body)

    if (!title || !description || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ 
        message: 'Title, description, and questions array are required' 
      });
    }

    for (const question of questions) {
      if (!question.type || !question.text) {
        return res.status(400).json({ 
          message: 'Each question must have a type and text' 
        });
      }

      if (!['text', 'single_choice', 'multiple_choice'].includes(question.type)) {
        return res.status(400).json({ 
          message: 'Invalid question type. Must be text, single_choice, or multiple_choice' 
        });
      }

      if (['single_choice', 'multiple_choice'].includes(question.type)) {
        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
          return res.status(400).json({ 
            message: 'Choice questions must have at least one option' 
          });
        }
      }
    }

    const questionnaire = new Questionnaire({
      title,
      description,
      questions
    });

    const newQuestionnaire = await questionnaire.save();
    res.status(201).json(newQuestionnaire);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    const questionnaire = await Questionnaire.findById(req.params.id);

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    if (!title || !description || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ 
        message: 'Title, description, and questions array are required' 
      });
    }

    for (const question of questions) {
      if (!question.type || !question.text) {
        return res.status(400).json({ 
          message: 'Each question must have a type and text' 
        });
      }

      if (!['text', 'single_choice', 'multiple_choice'].includes(question.type)) {
        return res.status(400).json({ 
          message: 'Invalid question type. Must be text, single_choice, or multiple_choice' 
        });
      }

      if (['single_choice', 'multiple_choice'].includes(question.type)) {
        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
          return res.status(400).json({ 
            message: 'Choice questions must have at least one option' 
          });
        }
      }
    }

    questionnaire.title = title;
    questionnaire.description = description;
    questionnaire.questions = questions;

    const updatedQuestionnaire = await questionnaire.save();
    res.json(updatedQuestionnaire);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    await Response.deleteMany({ questionnaireId: questionnaire._id });
    
    await questionnaire.deleteOne();
    
    res.json({ message: 'Questionnaire and associated responses deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 