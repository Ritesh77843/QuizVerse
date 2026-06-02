import { Request, Response } from 'express';
import prisma from '../prisma';

export const getQuizzes = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.userId;
    const quizzes = await prisma.quiz.findMany({
      where: { hostId: userId },
      orderBy: { createdAt: 'desc' }
    });
    
    // Calculate question counts
    const enrichedQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        const count = await prisma.question.count({ where: { quizId: quiz.id } });
        return {
          ...quiz,
          questionCount: count,
          hostDisplayName: (req as any).user.displayName
        };
      })
    );

    // Return in PageResponse shape that the frontend expects
    return res.json({
      success: true,
      message: 'Quizzes retrieved',
      data: {
        content: enrichedQuizzes,
        totalElements: enrichedQuizzes.length,
        totalPages: 1,
        number: 0,
        size: enrichedQuizzes.length,
        first: true,
        last: true,
      }
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPublicQuizzes = async (req: Request, res: Response): Promise<any> => {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: { displayName: true }
        }
      }
    });
    
    // Calculate question counts
    const enrichedQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        const count = await prisma.question.count({ where: { quizId: quiz.id } });
        return {
          ...quiz,
          questionCount: count,
          hostDisplayName: quiz.host.displayName
        };
      })
    );

    return res.json({
      success: true,
      message: 'Public quizzes retrieved',
      data: {
        content: enrichedQuizzes,
        totalElements: enrichedQuizzes.length,
        totalPages: 1,
        number: 0,
        size: enrichedQuizzes.length,
        first: true,
        last: true,
      }
    });
  } catch (error) {
    console.error('Error fetching public quizzes:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getQuizById = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    
    const quiz = await prisma.quiz.findFirst({
      where: { id },
      include: {
        questions: {
          include: {
            options: true
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    return res.json({
      success: true,
      message: 'Quiz retrieved',
      data: {
        ...quiz,
        questionCount: (quiz as any).questions.length,
        hostDisplayName: (req as any).user.displayName
      }
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createQuiz = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.userId;
    const { title, description, questions } = req.body;

    const quiz = await prisma.quiz.create({
      data: {
        title: title || 'Untitled Quiz',
        description: description || '',
        hostId: userId,
      }
    });

    // If questions were provided (e.g. from AI import), create them all
    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await prisma.question.create({
          data: {
            quizId: quiz.id,
            questionText: q.questionText || q.question || 'Question',
            questionType: 'SINGLE_CHOICE',
            timeLimitSeconds: q.timeLimit || 30,
            points: q.points || 1000,
            position: i + 1,
            options: {
              create: (q.options || []).map((opt: any, idx: number) => ({
                optionText: typeof opt === 'string' ? opt : (opt.text || `Option ${idx + 1}`),
                isCorrect: typeof opt === 'string' ? idx === q.correctAnswer : (opt.isCorrect || false),
                position: idx + 1,
              }))
            }
          }
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


export const updateQuiz = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.userId;
    const data = req.body;

    // Verify ownership
    const existing = await prisma.quiz.findFirst({ where: { id, hostId: userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const updated = await prisma.quiz.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        defaultTimeLimitSeconds: data.defaultTimeLimitSeconds,
        scoringMode: data.scoringMode,
        coverImageUrl: data.coverImageUrl
      }
    });

    // If questions array provided, sync them: delete all old, create new
    if (data.questions && Array.isArray(data.questions)) {
      // Delete all existing questions (cascades to options)
      await prisma.question.deleteMany({ where: { quizId: id } });

      // Re-create from payload
      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        await prisma.question.create({
          data: {
            quizId: id,
            questionText: q.questionText || 'Question',
            questionType: q.questionType || 'SINGLE_CHOICE',
            timeLimitSeconds: q.timeLimitSeconds || existing.defaultTimeLimitSeconds,
            points: q.points || 1000,
            position: q.position ?? (i + 1),
            options: {
              create: (q.options || []).map((opt: any, oi: number) => ({
                optionText: opt.optionText || `Option ${oi + 1}`,
                isCorrect: opt.isCorrect || false,
                position: opt.position ?? (oi + 1),
                colorCode: opt.colorCode,
              }))
            }
          }
        });
      }
    }

    return res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteQuiz = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.userId;
    
    const existing = await prisma.quiz.findFirst({ where: { id, hostId: userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    await prisma.quiz.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Quiz deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const addQuestionToQuiz = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.userId;
    const data = req.body;

    const existing = await prisma.quiz.findFirst({ where: { id, hostId: userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Determine max position
    const maxPos = await prisma.question.aggregate({
      where: { quizId: id },
      _max: { position: true }
    });
    const position = (maxPos._max?.position || 0) + 1;

    const newQuestion = await prisma.question.create({
      data: {
        quizId: id,
        questionText: data.questionText || 'New Question',
        questionType: data.questionType || 'SINGLE_CHOICE',
        timeLimitSeconds: data.timeLimitSeconds || existing.defaultTimeLimitSeconds,
        points: data.points || 1000,
        position,
        options: {
          create: data.options ? data.options.map((opt: any, i: number) => ({
            optionText: opt.optionText || `Option ${i+1}`,
            isCorrect: opt.isCorrect || false,
            position: i + 1,
            colorCode: opt.colorCode
          })) : []
        }
      },
      include: {
        options: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: newQuestion
    });
  } catch (error) {
    console.error('Error adding question:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const publishQuiz = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.userId;

    const existing = await prisma.quiz.findFirst({ where: { id, hostId: userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const updated = await prisma.quiz.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });

    return res.json({ success: true, message: 'Quiz published', data: updated });
  } catch (error) {
    console.error('Error publishing quiz:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const unpublishQuiz = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.userId;

    const existing = await prisma.quiz.findFirst({ where: { id, hostId: userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const updated = await prisma.quiz.update({
      where: { id },
      data: { status: 'DRAFT' }
    });

    return res.json({ success: true, message: 'Quiz unpublished', data: updated });
  } catch (error) {
    console.error('Error unpublishing quiz:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

