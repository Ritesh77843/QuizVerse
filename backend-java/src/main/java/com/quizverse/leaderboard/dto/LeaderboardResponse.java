package com.quizverse.leaderboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LeaderboardResponse {
    private String pin;
    private List<LeaderboardEntry> entries;
}
