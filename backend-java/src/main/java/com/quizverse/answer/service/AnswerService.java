package com.quizverse.answer.service;

import com.quizverse.answer.entity.Answer;
import com.quizverse.answer.repository.AnswerRepository;
import com.quizverse.common.exception.BadRequestException;
import com.quizverse.game.entity.GameSession;
import com.quizverse.game.entity.GameStatus;
import com.quizverse.game.repository.GameSessionRepository;
import com.quizverse.leaderboard.service.LeaderboardService;
import com.quizverse.player.entity.Player;
import com.quizverse.player.repository.PlayerRepository;
import com.quizverse.question.entity.Option;
import com.quizverse.question.entity.Question;
import com.quizverse.question.repository.OptionRepository;
import com.quizverse.question.repository.QuestionRepository;
import com.quizverse.websocket.dto.AnswerSubmitCommand;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnswerService {

    private final AnswerRepository answerRepository;
    private final PlayerRepository playerRepository;
    private final QuestionRepository questionRepository;
    private final OptionRepository optionRepository;
    private final GameSessionRepository gameSessionRepository;
    private final ScoringService scoringService;
    private final LeaderboardService leaderboardService;

    @Transactional
    public void submitAnswer(AnswerSubmitCommand command) {
        // Validate session is active
        GameSession session = gameSessionRepository.findByPin(command.getPin())
                .orElseThrow(() -> new BadRequestException("Game session not found"));

        if (session.getStatus() != GameStatus.ACTIVE) {
            throw new BadRequestException("Game is not currently active");
        }

        // Validate player belongs to this session
        Player player = playerRepository.findById(command.getPlayerId())
                .orElseThrow(() -> new BadRequestException("Player not found"));

        if (!player.getSession().getId().equals(session.getId())) {
            throw new BadRequestException("Player does not belong to this session");
        }

        // Dedup check — DB unique constraint is the ultimate guard, this is a fast pre-check
        if (answerRepository.existsByPlayerIdAndQuestionIdAndSessionId(
                command.getPlayerId(), command.getQuestionId(), session.getId())) {
            throw new BadRequestException("Answer already submitted for this question");
        }

        Question question = questionRepository.findById(command.getQuestionId())
                .orElseThrow(() -> new BadRequestException("Question not found"));

        Option selectedOption = null;
        boolean isCorrect = false;

        if (command.getOptionId() != null) {
            selectedOption = optionRepository.findById(command.getOptionId())
                    .orElseThrow(() -> new BadRequestException("Option not found"));
            isCorrect = selectedOption.isCorrect();
        }

        long responseTimeMs = System.currentTimeMillis() - command.getClientTimestamp();
        int pointsAwarded = isCorrect
                ? scoringService.calculatePoints(question, responseTimeMs)
                : 0;

        Answer answer = Answer.builder()
                .player(player)
                .question(question)
                .session(session)
                .selectedOption(selectedOption)
                .isCorrect(isCorrect)
                .pointsAwarded(pointsAwarded)
                .responseTimeMs((int) Math.min(responseTimeMs, Integer.MAX_VALUE))
                .build();

        answerRepository.save(answer);

        // Update player score
        player.setScore(player.getScore() + pointsAwarded);
        playerRepository.save(player);

        // Update Redis leaderboard
        leaderboardService.incrementScore(
                command.getPin(),
                command.getPlayerId().toString(),
                pointsAwarded
        );

        log.debug("Answer submitted: player={}, correct={}, points={}", 
                  command.getPlayerId(), isCorrect, pointsAwarded);
    }
}
