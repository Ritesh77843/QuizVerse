package com.quizverse.question.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OptionRequest {

    @NotBlank(message = "Option text is required")
    private String optionText;

    private boolean isCorrect = false;

    private int position = 0;

    private String colorCode;
}
