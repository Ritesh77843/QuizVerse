package com.quizverse.game.controller;

import com.quizverse.auth.service.JwtService;
import com.quizverse.common.dto.ApiResponse;
import com.quizverse.game.dto.CreateGameRequest;
import com.quizverse.game.dto.GameSessionResponse;
import com.quizverse.game.dto.JoinGameRequest;
import com.quizverse.game.service.GameService;
import com.quizverse.leaderboard.dto.LeaderboardResponse;
import com.quizverse.leaderboard.service.LeaderboardService;
import com.quizverse.player.dto.PlayerDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/games")
@RequiredArgsConstructor
@Tag(name = "Game Sessions", description = "Live game session management")
public class GameController {

    private final GameService gameService;
    private final LeaderboardService leaderboardService;
    private final JwtService jwtService;

    private UUID extractUserId(String authHeader) {
        return jwtService.extractUserId(authHeader.substring(7));
    }

    @PostMapping
    @Operation(summary = "Create a new game session and get PIN")
    @PreAuthorize("hasRole('HOST') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GameSessionResponse>> createSession(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody CreateGameRequest request) {
        UUID hostId = extractUserId(authHeader);
        GameSessionResponse response = gameService.createSession(request, hostId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Game session created", response));
    }

    @GetMapping("/{pin}")
    @Operation(summary = "Get session info by PIN (public)")
    public ResponseEntity<ApiResponse<GameSessionResponse>> getSession(@PathVariable String pin) {
        return ResponseEntity.ok(ApiResponse.success("Session found", gameService.getSession(pin)));
    }

    @PostMapping("/{pin}/join")
    @Operation(summary = "Join game as a player (no auth required)")
    public ResponseEntity<ApiResponse<PlayerDto>> joinGame(
            @PathVariable String pin,
            @Valid @RequestBody JoinGameRequest request) {
        PlayerDto player = gameService.joinSession(pin, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Joined successfully", player));
    }

    @GetMapping("/{pin}/leaderboard")
    @Operation(summary = "Get current leaderboard (public)")
    public ResponseEntity<ApiResponse<LeaderboardResponse>> getLeaderboard(
            @PathVariable String pin) {
        // Get session ID first, then pass to leaderboard service
        GameSessionResponse session = gameService.getSession(pin);
        LeaderboardResponse lb = leaderboardService.getLeaderboard(pin, session.getId());
        return ResponseEntity.ok(ApiResponse.success("Leaderboard retrieved", lb));
    }
}
