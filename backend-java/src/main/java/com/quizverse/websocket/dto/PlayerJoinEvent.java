package com.quizverse.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PlayerJoinEvent {
    private String nickname;
    private String avatarSeed;
    private int totalPlayers;
}
