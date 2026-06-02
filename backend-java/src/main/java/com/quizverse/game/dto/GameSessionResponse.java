package com.quizverse.game.dto;

import com.quizverse.game.entity.GameStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GameSessionResponse {
    private UUID id;
    private String pin;
    private UUID quizId;
    private String quizTitle;
    private UUID hostId;
    private GameStatus status;
    private int currentQuestionIndex;
    private int totalQuestions;
    private long playerCount;
    private OffsetDateTime startedAt;
    private OffsetDateTime createdAt;
}
