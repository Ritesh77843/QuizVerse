package com.quizverse.websocket.dto;

import com.quizverse.game.entity.GameStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GameStateEvent {
    private String pin;
    private GameStatus status;
    private int playerCount;
    private int currentQuestionIndex;
    private int totalQuestions;
}
