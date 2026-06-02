package com.quizverse.question.dto;

import com.quizverse.question.entity.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class QuestionResponse {
    private UUID id;
    private UUID quizId;
    private String questionText;
    private QuestionType questionType;
    private int timeLimitSeconds;
    private int points;
    private int position;
    private String mediaUrl;
    private List<OptionResponse> options;
    private OffsetDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OptionResponse {
        private UUID id;
        private String optionText;
        private boolean isCorrect;
        private int position;
        private String colorCode;
    }
}
