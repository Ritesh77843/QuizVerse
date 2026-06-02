package com.quizverse.question.dto;

import com.quizverse.question.entity.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class QuestionRequest {

    @NotBlank(message = "Question text is required")
    private String questionText;

    private QuestionType questionType = QuestionType.SINGLE_CHOICE;

    @Positive(message = "Time limit must be positive")
    @Max(value = 120, message = "Time limit cannot exceed 120 seconds")
    private int timeLimitSeconds = 30;

    @Positive(message = "Points must be positive")
    @Max(value = 5000, message = "Points cannot exceed 5000")
    private int points = 1000;

    private int position = 0;

    private String mediaUrl;

    @NotEmpty(message = "At least one option is required")
    @Valid
    private List<OptionRequest> options;
}
