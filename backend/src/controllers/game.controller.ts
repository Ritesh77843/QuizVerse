import { Request, Response } from 'express';
import prisma from '../prisma';

export const createGameSession = async (req: Request, res: Response): Promise<any> => {
  try {
    const { quizId } = req.body;
    const userId = (req as any).user.userId;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true }
    });

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    if (quiz.hostId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Generate random 6 digit pin
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    const game = await prisma.gameSession.create({
      data: {
        pin,
        quizId,
        hostId: userId,
        status: 'WAITING',
        currentQuestionIndex: 0,
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Game session created',
      data: {
        ...game,
        quizTitle: quiz.title,
        totalQuestions: quiz.questions.length,
        playerCount: 0
      }
    });
  } catch (error) {
    console.error('Error creating game session:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getGameSessionByPin = async (req: Request, res: Response): Promise<any> => {
  try {
    const pin = req.params.pin as string;
    
    const game = await prisma.gameSession.findUnique({
      where: { pin },
      include: {
        quiz: {
          include: { questions: true }
        },
        players: true
      }
    });

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game session not found' });
    }

    return res.json({
      success: true,
      message: 'Game session retrieved',
      data: {
        ...game,
        quizTitle: (game as any).quiz.title,
        totalQuestions: (game as any).quiz.questions.length,
        playerCount: (game as any).players.length
      }
    });
  } catch (error) {
    console.error('Error fetching game session:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
