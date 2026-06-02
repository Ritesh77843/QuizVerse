package com.quizverse.answer.service;

import com.quizverse.question.entity.Question;
import org.springframework.stereotype.Service;

@Service
public class ScoringService {

    private static final int MAX_POINTS_BONUS = 500;

    /**
     * Standard scoring: base points + speed bonus.
     * Max bonus applies when answered immediately; bonus decreases linearly to 0 at time limit.
     */
    public int calculatePoints(Question question, long responseTimeMs) {
        int basePoints = question.getPoints();
        long timeLimitMs = (long) question.getTimeLimitSeconds() * 1000;

        if (responseTimeMs <= 0) responseTimeMs = 1;
        if (responseTimeMs >= timeLimitMs) return basePoints; // No speed bonus

        double speedRatio = 1.0 - ((double) responseTimeMs / timeLimitMs);
        int speedBonus = (int) Math.round(MAX_POINTS_BONUS * speedRatio);

        return basePoints + speedBonus;
    }
}
