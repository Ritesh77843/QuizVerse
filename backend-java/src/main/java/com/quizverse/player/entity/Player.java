package com.quizverse.player.entity;

import com.quizverse.game.entity.GameSession;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "players",
       uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "nickname"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSession session;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "avatar_seed", length = 100)
    private String avatarSeed;

    @Column(nullable = false)
    @Builder.Default
    private int score = 0;

    @Column
    private Integer rank;

    @CreationTimestamp
    @Column(name = "connected_at", nullable = false, updatable = false)
    private OffsetDateTime connectedAt;

    @Column(name = "disconnected_at")
    private OffsetDateTime disconnectedAt;
}
