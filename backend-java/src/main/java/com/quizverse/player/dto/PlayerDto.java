package com.quizverse.player.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PlayerDto {
    private UUID id;
    private String nickname;
    private String avatarSeed;
    private int score;
    private Integer rank;
    private String sessionPin;
}
