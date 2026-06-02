package com.quizverse.game.repository;

import com.quizverse.game.entity.GameSession;
import com.quizverse.game.entity.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, UUID> {

    Optional<GameSession> findByPin(String pin);

    Optional<GameSession> findByPinAndStatus(String pin, GameStatus status);

    List<GameSession> findByHostId(UUID hostId);

    boolean existsByPin(String pin);
}
