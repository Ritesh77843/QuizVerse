package com.quizverse.analytics.service;

import com.quizverse.analytics.dto.SessionSummaryResponse;
import com.quizverse.answer.repository.AnswerRepository;
import com.quizverse.common.exception.ResourceNotFoundException;
import com.quizverse.game.entity.GameSession;
import com.quizverse.game.repository.GameSessionRepository;
import com.quizverse.player.repository.PlayerRepository;
import com.quizverse.question.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final GameSessionRepository gameSessionRepository;
    private final PlayerRepository playerRepository;
    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;

    @Transactional(readOnly = true)
    public SessionSummaryResponse getSessionSummary(String pin, UUID hostId) {
        GameSession session = gameSessionRepository.findByPin(pin)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + pin));

        if (!session.getHost().getId().equals(hostId)) {
            throw new ResourceNotFoundException("Session not found: " + pin);
        }

        long totalPlayers = playerRepository.countBySessionId(session.getId());
        var players = playerRepository.findBySessionIdOrderByScoreDesc(session.getId());

        double averageScore = players.stream()
                .mapToInt(p -> p.getScore())
                .average()
                .orElse(0.0);

        int maxScore = players.stream().mapToInt(p -> p.getScore()).max().orElse(0);

        var questions = questionRepository.findByQuizIdOrderByPositionAsc(session.getQuiz().getId());
        List<SessionSummaryResponse.QuestionStat> questionStats = questions.stream()
                .map(q -> {
                    long correct = answerRepository.countCorrectByQuestionAndSession(q.getId(), session.getId());
                    long total = answerRepository.countTotalByQuestionAndSession(q.getId(), session.getId());
                    double accuracy = total > 0 ? (double) correct / total * 100 : 0;
                    return SessionSummaryResponse.QuestionStat.builder()
                            .questionId(q.getId())
                            .questionText(q.getQuestionText())
                            .totalAnswers((int) total)
                            .correctAnswers((int) correct)
                            .accuracyPercent(Math.round(accuracy * 10.0) / 10.0)
                            .build();
                })
                .collect(Collectors.toList());

        return SessionSummaryResponse.builder()
                .pin(pin)
                .quizTitle(session.getQuiz().getTitle())
                .totalPlayers((int) totalPlayers)
                .averageScore(Math.round(averageScore * 10.0) / 10.0)
                .topScore(maxScore)
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .questionStats(questionStats)
                .build();
    }
}
