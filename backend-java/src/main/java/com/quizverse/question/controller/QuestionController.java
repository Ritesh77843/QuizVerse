package com.quizverse.question.controller;

import com.quizverse.auth.service.JwtService;
import com.quizverse.common.dto.ApiResponse;
import com.quizverse.question.dto.QuestionRequest;
import com.quizverse.question.dto.QuestionResponse;
import com.quizverse.question.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/quizzes/{quizId}/questions")
@RequiredArgsConstructor
@Tag(name = "Questions", description = "Question and option management")
@PreAuthorize("hasRole('HOST') or hasRole('ADMIN')")
public class QuestionController {

    private final QuestionService questionService;
    private final JwtService jwtService;

    private UUID extractUserId(String authHeader) {
        return jwtService.extractUserId(authHeader.substring(7));
    }

    @GetMapping
    @Operation(summary = "List all questions for a quiz")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getQuestions(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID quizId) {
        UUID hostId = extractUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Questions retrieved",
                questionService.getQuestions(quizId, hostId)));
    }

    @PostMapping
    @Operation(summary = "Add a question with options")
    public ResponseEntity<ApiResponse<QuestionResponse>> addQuestion(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID quizId,
            @Valid @RequestBody QuestionRequest request) {
        UUID hostId = extractUserId(authHeader);
        QuestionResponse response = questionService.addQuestion(quizId, request, hostId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Question added", response));
    }

    @PutMapping("/{questionId}")
    @Operation(summary = "Update a question and its options")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestion(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID quizId,
            @PathVariable UUID questionId,
            @Valid @RequestBody QuestionRequest request) {
        UUID hostId = extractUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Question updated",
                questionService.updateQuestion(quizId, questionId, request, hostId)));
    }

    @DeleteMapping("/{questionId}")
    @Operation(summary = "Delete a question")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID quizId,
            @PathVariable UUID questionId) {
        UUID hostId = extractUserId(authHeader);
        questionService.deleteQuestion(quizId, questionId, hostId);
        return ResponseEntity.ok(ApiResponse.success("Question deleted", null));
    }
}
