package com.quizverse.leaderboard.service;

import com.quizverse.leaderboard.dto.LeaderboardEntry;
import com.quizverse.leaderboard.dto.LeaderboardResponse;
import com.quizverse.player.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final PlayerRepository playerRepository;

    private static final String LEADERBOARD_KEY_PREFIX = "game:%s:leaderboard";
    private static final long LEADERBOARD_TTL_HOURS = 24;

    private String leaderboardKey(String pin) {
        return String.format(LEADERBOARD_KEY_PREFIX, pin);
    }

    public void updateScore(String pin, String playerId, double score) {
        String key = leaderboardKey(pin);
        redisTemplate.opsForZSet().add(key, playerId, score);
        redisTemplate.expire(key, LEADERBOARD_TTL_HOURS, TimeUnit.HOURS);
    }

    public void incrementScore(String pin, String playerId, double delta) {
        String key = leaderboardKey(pin);
        redisTemplate.opsForZSet().incrementScore(key, playerId, delta);
        redisTemplate.expire(key, LEADERBOARD_TTL_HOURS, TimeUnit.HOURS);
    }

    public LeaderboardResponse getLeaderboard(String pin, UUID sessionId) {
        String key = leaderboardKey(pin);
        Set<ZSetOperations.TypedTuple<Object>> tuples =
                redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, 9);

        List<LeaderboardEntry> entries = new ArrayList<>();
        if (tuples != null) {
            int rank = 1;
            for (ZSetOperations.TypedTuple<Object> tuple : tuples) {
                String playerId = (String) tuple.getValue();
                // Look up nickname from DB
                playerRepository.findById(UUID.fromString(playerId)).ifPresent(player -> {
                    entries.add(LeaderboardEntry.builder()
                            .rank(entries.size() + 1)
                            .nickname(player.getNickname())
                            .avatarSeed(player.getAvatarSeed())
                            .score((int) Math.round(tuple.getScore() != null ? tuple.getScore() : 0))
                            .build());
                });
            }
        }

        return LeaderboardResponse.builder()
                .pin(pin)
                .entries(entries)
                .build();
    }

    public void removeGame(String pin) {
        redisTemplate.delete(leaderboardKey(pin));
    }

    public Double getPlayerScore(String pin, String playerId) {
        return redisTemplate.opsForZSet().score(leaderboardKey(pin), playerId);
    }
}
