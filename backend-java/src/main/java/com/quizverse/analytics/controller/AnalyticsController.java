package com.quizverse.analytics.controller;

import com.quizverse.analytics.dto.SessionSummaryResponse;
import com.quizverse.analytics.service.AnalyticsService;
import com.quizverse.auth.service.JwtService;
import com.quizverse.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Game session reports and statistics")
@PreAuthorize("hasRole('HOST') or hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final JwtService jwtService;

    private UUID extractUserId(String authHeader) {
        return jwtService.extractUserId(authHeader.substring(7));
    }

    @GetMapping("/sessions/{pin}")
    @Operation(summary = "Get full session analytics summary")
    public ResponseEntity<ApiResponse<SessionSummaryResponse>> getSessionSummary(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String pin) {
        UUID hostId = extractUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Analytics retrieved",
                analyticsService.getSessionSummary(pin, hostId)));
    }
}
