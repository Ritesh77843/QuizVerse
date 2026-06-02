package com.quizverse.quiz.dto;

import com.quizverse.quiz.entity.QuizStatus;
import com.quizverse.quiz.entity.ScoringMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class QuizResponse {
    private UUID id;
    private String title;
    private String description;
    private QuizStatus status;
    private int defaultTimeLimitSeconds;
    private ScoringMode scoringMode;
    private String coverImageUrl;
    private UUID hostId;
    private String hostDisplayName;
    private long questionCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
