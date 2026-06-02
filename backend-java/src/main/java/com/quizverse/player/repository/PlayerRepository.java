package com.quizverse.player.repository;

import com.quizverse.player.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlayerRepository extends JpaRepository<Player, UUID> {

    List<Player> findBySessionIdOrderByScoreDesc(UUID sessionId);

    Optional<Player> findBySessionIdAndNickname(UUID sessionId, String nickname);

    boolean existsBySessionIdAndNickname(UUID sessionId, String nickname);

    long countBySessionId(UUID sessionId);

    @Query("SELECT p FROM Player p WHERE p.session.id = :sessionId ORDER BY p.score DESC")
    List<Player> findLeaderboardBySessionId(UUID sessionId);
}
