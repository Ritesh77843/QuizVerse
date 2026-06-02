import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.middleware';
import { importQuiz, getImportStatus } from '../controllers/ai.controller';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticateToken);

router.post('/import', importQuiz);
router.post('/import/topic', importQuiz);
router.post('/import/text', importQuiz);
router.post('/import/url', importQuiz);
router.post('/import/pdf', upload.single('file'), importQuiz);
router.post('/import/image', upload.single('file'), importQuiz);

router.get('/import/:jobId', getImportStatus);

export default router;
