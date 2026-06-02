package com.quizverse.ai.controller;

import com.quizverse.ai.dto.ImportJobResponse;
import com.quizverse.ai.service.AiImportService;
import com.quizverse.auth.service.JwtService;
import com.quizverse.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Tag(name = "AI Import", description = "AI-assisted quiz generation from various sources")
@PreAuthorize("hasRole('HOST') or hasRole('ADMIN')")
public class AiImportController {

    private final AiImportService aiImportService;
    private final JwtService jwtService;

    private UUID extractUserId(String authHeader) {
        return jwtService.extractUserId(authHeader.substring(7));
    }

    @PostMapping("/import/text")
    @Operation(summary = "Import quiz from raw text")
    public ResponseEntity<ApiResponse<ImportJobResponse>> importText(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        String text = body.get("text");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Text is required", "BAD_REQUEST"));
        }
        UUID hostId = extractUserId(authHeader);
        ImportJobResponse response = aiImportService.importText(text, hostId);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Import job queued", response));
    }

    @PostMapping(value = "/import/pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import quiz from PDF file")
    public ResponseEntity<ApiResponse<ImportJobResponse>> importPdf(
            @RequestHeader("Authorization") String authHeader,
            @RequestPart("file") MultipartFile file) throws Exception {
        UUID hostId = extractUserId(authHeader);
        ImportJobResponse response = aiImportService.importPdf(file, hostId);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("PDF import job queued", response));
    }

    @PostMapping(value = "/import/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import quiz from image (OCR)")
    public ResponseEntity<ApiResponse<ImportJobResponse>> importImage(
            @RequestHeader("Authorization") String authHeader,
            @RequestPart("file") MultipartFile file) throws Exception {
        UUID hostId = extractUserId(authHeader);
        ImportJobResponse response = aiImportService.importImage(file, hostId);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Image import job queued", response));
    }

    @PostMapping("/import/url")
    @Operation(summary = "Import quiz from webpage URL")
    public ResponseEntity<ApiResponse<ImportJobResponse>> importUrl(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        String url = body.get("url");
        UUID hostId = extractUserId(authHeader);
        ImportJobResponse response = aiImportService.importUrl(url, hostId);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("URL import job queued", response));
    }

    @GetMapping("/import/jobs/{jobId}")
    @Operation(summary = "Get import job status")
    public ResponseEntity<ApiResponse<ImportJobResponse>> getJobStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID jobId) {
        UUID hostId = extractUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Job status retrieved",
                aiImportService.getJobStatus(jobId, hostId)));
    }

    @PostMapping("/drafts/{draftId}/approve")
    @Operation(summary = "Approve a draft — creates actual quiz")
    public ResponseEntity<ApiResponse<Map<String, UUID>>> approveDraft(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID draftId) {
        UUID hostId = extractUserId(authHeader);
        UUID quizId = aiImportService.approveDraft(draftId, hostId);
        return ResponseEntity.ok(ApiResponse.success("Draft approved, quiz created",
                Map.of("quizId", quizId)));
    }

    @DeleteMapping("/drafts/{draftId}")
    @Operation(summary = "Discard a draft")
    public ResponseEntity<ApiResponse<Void>> discardDraft(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID draftId) {
        UUID hostId = extractUserId(authHeader);
        aiImportService.discardDraft(draftId, hostId);
        return ResponseEntity.ok(ApiResponse.success("Draft discarded", null));
    }
}
