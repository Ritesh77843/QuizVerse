package com.quizverse.websocket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class AnswerSubmitCommand {

    @NotBlank
    private String pin;

    private UUID questionId;

    private UUID optionId;

    private UUID playerId;

    private long clientTimestamp;
}
