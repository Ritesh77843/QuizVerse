package com.quizverse.game.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateGameRequest {

    @NotNull(message = "Quiz ID is required")
    private UUID quizId;
}
