package com.quizverse.quiz.controller;

import com.quizverse.auth.service.JwtService;
import com.quizverse.common.dto.ApiResponse;
import com.quizverse.quiz.dto.QuizRequest;
import com.quizverse.quiz.dto.QuizResponse;
import com.quizverse.quiz.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
@Tag(name = "Quizzes", description = "Quiz management")
@PreAuthorize("hasRole('HOST') or hasRole('ADMIN')")
public class QuizController {

    private final QuizService quizService;
    private final JwtService jwtService;

    private UUID extractUserId(String authHeader) {
        return jwtService.extractUserId(authHeader.substring(7));
    }

    @GetMapping
    @Operation(summary = "List my quizzes (paginated)")
    public ResponseEntity<ApiResponse<Page<QuizResponse>>> getMyQuizzes(
            @RequestHeader("Authorization") String authHeader,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        UUID hostId = extractUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Quizzes retrieved",
                quizService.getMyQuizzes(hostId, pageable)));
    }

    @PostMapping
    @Operation(summary = "Create a new quiz (starts as DRAFT)")
    public ResponseEntity<ApiResponse<QuizResponse>> createQuiz(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody QuizRequest request) {
        UUID hostId = extractUserId(authHeader);
        QuizResponse response = quizService.createQuiz(request, hostId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Quiz created", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get quiz details")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuiz(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id) {
        UUID hostId = extractUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Quiz retrieved",
                quizService.getQuiz(id, hostId)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update quiz metadata")
    public ResponseEntity<ApiResponse<QuizResponse>> updateQuiz(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @Valid @RequestBody QuizRequest request) {
        UUID hostId = extractUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Quiz updated",
                quizService.updateQuiz(id, request, hostId)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a quiz")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id) {
        UUID hostId = extractUserId(authHeader);
        quizService.deleteQuiz(id, hostId);
        return ResponseEntity.ok(ApiResponse.success("Quiz deleted", null));
    }

    @PatchMapping("/{id}/publish")
    @Operation(summary = "Publish a quiz")
    public ResponseEntity<ApiResponse<QuizResponse>> publishQuiz(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id) {
        UUID hostId = extractUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Quiz published",
                quizService.publishQuiz(id, hostId)));
    }

    @PatchMapping("/{id}/unpublish")
    @Operation(summary = "Unpublish a quiz")
    public ResponseEntity<ApiResponse<QuizResponse>> unpublishQuiz(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id) {
        UUID hostId = extractUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Quiz unpublished",
                quizService.unpublishQuiz(id, hostId)));
    }
}
