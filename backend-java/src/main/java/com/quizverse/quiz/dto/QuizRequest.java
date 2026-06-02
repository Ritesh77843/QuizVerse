package com.quizverse.quiz.dto;

import com.quizverse.quiz.entity.ScoringMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class QuizRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @Positive(message = "Time limit must be positive")
    private int defaultTimeLimitSeconds = 30;

    private ScoringMode scoringMode = ScoringMode.STANDARD;

    private String coverImageUrl;
}
