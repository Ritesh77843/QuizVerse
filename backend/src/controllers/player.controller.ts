import { Request, Response } from 'express';
import prisma from '../prisma';

export const joinGame = async (req: Request, res: Response): Promise<any> => {
  try {
    // PIN can come from URL param (/games/:pin/join) or body (legacy)
    const pin = req.params.pin || req.body.sessionPin;
    const { nickname, avatarSeed } = req.body;

    if (!pin) {
      return res.status(400).json({ success: false, message: 'Game PIN is required' });
    }
    if (!nickname || nickname.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Nickname must be at least 2 characters' });
    }

    const game = await prisma.gameSession.findUnique({
      where: { pin }
    });

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game session not found' });
    }

    if (game.status !== 'WAITING') {
      return res.status(400).json({ success: false, message: 'Game has already started or ended' });
    }

    if ((game as any).isLocked) {
      return res.status(403).json({ success: false, message: 'This game is locked. No new players can join.' });
    }

    const trimmedNickname = nickname.trim();

    // If a player with this nickname already exists, replace them (new device takeover)
    // The socket layer will handle kicking the old device's connection
    const existingPlayer = await prisma.player.findFirst({
      where: { sessionPin: pin, nickname: trimmedNickname }
    });

    if (existingPlayer) {
      // Delete and recreate so the new device gets a fresh player ID
      // The old socket will receive a 'force-disconnect' event from the socket handler
      await prisma.player.delete({ where: { id: existingPlayer.id } });
    }

    const player = await prisma.player.create({
      data: {
        nickname: trimmedNickname,
        avatarSeed: avatarSeed || trimmedNickname,
        sessionPin: pin,
        score: 0
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Joined successfully',
      data: player
    });
  } catch (error) {
    console.error('Error joining game:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
