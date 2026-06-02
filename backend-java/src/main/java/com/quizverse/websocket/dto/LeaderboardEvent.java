package com.quizverse.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LeaderboardEvent {
    private String pin;
    private List<LeaderboardEntry> entries;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LeaderboardEntry {
        private int rank;
        private String nickname;
        private String avatarSeed;
        private int score;
        private int pointsLastRound;
    }
}
