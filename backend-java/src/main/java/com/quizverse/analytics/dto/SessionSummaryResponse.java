package com.quizverse.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SessionSummaryResponse {
    private String pin;
    private String quizTitle;
    private int totalPlayers;
    private double averageScore;
    private int topScore;
    private OffsetDateTime startedAt;
    private OffsetDateTime endedAt;
    private List<QuestionStat> questionStats;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class QuestionStat {
        private UUID questionId;
        private String questionText;
        private int totalAnswers;
        private int correctAnswers;
        private double accuracyPercent;
    }
}
