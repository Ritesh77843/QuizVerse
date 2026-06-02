import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { 
  getQuizzes, 
  getQuizById, 
  createQuiz, 
  updateQuiz, 
  deleteQuiz,
  addQuestionToQuiz,
  publishQuiz,
  unpublishQuiz,
  getPublicQuizzes
} from '../controllers/quiz.controller';

const router = Router();

router.get('/public', getPublicQuizzes); // Must be before /:id

router.use(authenticateToken);

router.get('/', getQuizzes);
router.get('/:id', getQuizById);
router.post('/', createQuiz);
router.put('/:id', updateQuiz);
router.delete('/:id', deleteQuiz);
router.post('/:id/questions', addQuestionToQuiz);
router.patch('/:id/publish', publishQuiz);
router.patch('/:id/unpublish', unpublishQuiz);

export default router;
