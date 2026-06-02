package com.quizverse.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizverse.ai.dto.AiParseResponse;
import com.quizverse.ai.dto.ImportJobResponse;
import com.quizverse.ai.entity.*;
import com.quizverse.ai.repository.AiGeneratedDraftRepository;
import com.quizverse.ai.repository.ImportJobRepository;
import com.quizverse.ai.repository.QuizDraftRepository;
import com.quizverse.common.exception.BadRequestException;
import com.quizverse.common.exception.ResourceNotFoundException;
import com.quizverse.file.service.FileStorageService;
import com.quizverse.question.dto.OptionRequest;
import com.quizverse.question.dto.QuestionRequest;
import com.quizverse.question.entity.QuestionType;
import com.quizverse.question.service.QuestionService;
import com.quizverse.quiz.dto.QuizRequest;
import com.quizverse.quiz.entity.Quiz;
import com.quizverse.quiz.service.QuizService;
import com.quizverse.user.entity.User;
import com.quizverse.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiImportService {

    private final ImportJobRepository importJobRepository;
    private final QuizDraftRepository quizDraftRepository;
    private final AiGeneratedDraftRepository aiGeneratedDraftRepository;
    private final UserRepository userRepository;
    private final AiHttpClient aiHttpClient;
    private final FileStorageService fileStorageService;
    private final QuizService quizService;
    private final QuestionService questionService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ImportJobResponse importText(String text, UUID hostId) {
        User host = getHost(hostId);
        ImportJob job = createJob(host, ImportSourceType.TEXT, null);

        processAsync(job, () -> aiHttpClient.parseText(text), hostId);
        return mapJobToResponse(job, null);
    }

    @Transactional
    public ImportJobResponse importPdf(MultipartFile file, UUID hostId) {
        validateFileType(file, new String[]{"application/pdf"});
        User host = getHost(hostId);
        String fileRef = fileStorageService.store(file);
        ImportJob job = createJob(host, ImportSourceType.PDF, fileRef);

        processAsync(job, () -> aiHttpClient.parsePdf(file), hostId);
        return mapJobToResponse(job, null);
    }

    @Transactional
    public ImportJobResponse importImage(MultipartFile file, UUID hostId) {
        validateFileType(file, new String[]{"image/png", "image/jpeg", "image/webp"});
        User host = getHost(hostId);
        String fileRef = fileStorageService.store(file);
        ImportJob job = createJob(host, ImportSourceType.IMAGE, fileRef);

        processAsync(job, () -> aiHttpClient.parseImage(file), hostId);
        return mapJobToResponse(job, null);
    }

    @Transactional
    public ImportJobResponse importUrl(String url, UUID hostId) {
        validateUrl(url);
        User host = getHost(hostId);
        ImportJob job = createJob(host, ImportSourceType.URL, url);

        processAsync(job, () -> aiHttpClient.parseUrl(url), hostId);
        return mapJobToResponse(job, null);
    }

    @Transactional(readOnly = true)
    public ImportJobResponse getJobStatus(UUID jobId, UUID hostId) {
        ImportJob job = importJobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (!job.getHost().getId().equals(hostId)) {
            throw new ResourceNotFoundException("Job not found");
        }

        QuizDraft draft = quizDraftRepository.findByHostIdOrderByCreatedAtDesc(hostId)
                .stream()
                .filter(d -> d.getImportJob() != null && d.getImportJob().getId().equals(jobId))
                .findFirst()
                .orElse(null);

        return mapJobToResponse(job, draft);
    }

    @Transactional
    public UUID approveDraft(UUID draftId, UUID hostId) {
        QuizDraft draft = quizDraftRepository.findByIdAndHostId(draftId, hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Draft not found"));

        if (draft.getStatus() != DraftStatus.PENDING_REVIEW) {
            throw new BadRequestException("Draft is not in PENDING_REVIEW state");
        }

        // Create quiz from draft
        QuizRequest quizRequest = new QuizRequest();
        quizRequest.setTitle(draft.getTitle() != null ? draft.getTitle() : "Imported Quiz");
        var quizResponse = quizService.createQuiz(quizRequest, hostId);

        // Parse questions from raw_data and create them
        try {
            var rawData = objectMapper.readTree(draft.getRawData());
            var questionsNode = rawData.get("questions");

            if (questionsNode != null && questionsNode.isArray()) {
                int position = 0;
                for (var qNode : questionsNode) {
                    QuestionRequest qRequest = new QuestionRequest();
                    qRequest.setQuestionText(qNode.path("question").asText());
                    qRequest.setQuestionType(QuestionType.SINGLE_CHOICE);
                    qRequest.setTimeLimitSeconds(30);
                    qRequest.setPoints(1000);
                    qRequest.setPosition(position++);

                    List<OptionRequest> options = new ArrayList<>();
                    var optNodes = qNode.path("options");
                    int correctIdx = qNode.path("correctAnswer").asInt(0);

                    for (int i = 0; i < optNodes.size(); i++) {
                        OptionRequest opt = new OptionRequest();
                        opt.setOptionText(optNodes.get(i).asText());
                        opt.setCorrect(i == correctIdx);
                        options.add(opt);
                    }
                    qRequest.setOptions(options);
                    questionService.addQuestion(quizResponse.getId(), qRequest, hostId);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse draft raw_data: {}", e.getMessage());
            throw new BadRequestException("Failed to create quiz from draft: " + e.getMessage());
        }

        // Mark draft as approved
        draft.setStatus(DraftStatus.APPROVED);
        quizDraftRepository.save(draft);

        // Update AI generated draft approval
        aiGeneratedDraftRepository.findByImportJobId(draft.getImportJob().getId()).ifPresent(ad -> {
            ad.setApprovedBy(userRepository.findById(hostId).orElse(null));
            ad.setApprovedAt(OffsetDateTime.now());
            aiGeneratedDraftRepository.save(ad);
        });

        log.info("Draft approved, quiz created: {} from draft: {}", quizResponse.getId(), draftId);
        return quizResponse.getId();
    }

    @Transactional
    public void discardDraft(UUID draftId, UUID hostId) {
        QuizDraft draft = quizDraftRepository.findByIdAndHostId(draftId, hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Draft not found"));
        draft.setStatus(DraftStatus.DISCARDED);
        quizDraftRepository.save(draft);
    }

    @Async
    protected void processAsync(ImportJob job, AiCallable callable, UUID hostId) {
        job.setStatus(ImportJobStatus.PROCESSING);
        importJobRepository.save(job);

        try {
            AiParseResponse aiResponse = callable.call();

            String rawJson = objectMapper.writeValueAsString(aiResponse);

            QuizDraft draft = QuizDraft.builder()
                    .host(job.getHost())
                    .importJob(job)
                    .title("AI Import - " + job.getSourceType().name())
                    .rawData(rawJson)
                    .status(DraftStatus.PENDING_REVIEW)
                    .build();
            quizDraftRepository.save(draft);

            AiGeneratedDraft aiDraft = AiGeneratedDraft.builder()
                    .importJob(job)
                    .quizDraft(draft)
                    .rawResponse(rawJson)
                    .build();
            aiGeneratedDraftRepository.save(aiDraft);

            job.setStatus(ImportJobStatus.COMPLETED);
            job.setCompletedAt(OffsetDateTime.now());

        } catch (Exception e) {
            log.error("AI import job failed: {}", e.getMessage());
            job.setStatus(ImportJobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            job.setCompletedAt(OffsetDateTime.now());
        }

        importJobRepository.save(job);
    }

    private ImportJob createJob(User host, ImportSourceType sourceType, String sourceRef) {
        ImportJob job = ImportJob.builder()
                .host(host)
                .sourceType(sourceType)
                .sourceRef(sourceRef)
                .status(ImportJobStatus.QUEUED)
                .build();
        return importJobRepository.save(job);
    }

    private User getHost(UUID hostId) {
        return userRepository.findById(hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Host not found"));
    }

    private void validateFileType(MultipartFile file, String[] allowedTypes) {
        String contentType = file.getContentType();
        if (contentType == null) throw new BadRequestException("File content type is missing");
        for (String allowed : allowedTypes) {
            if (allowed.equals(contentType)) return;
        }
        throw new BadRequestException("File type not supported: " + contentType);
    }

    private void validateUrl(String url) {
        // Basic SSRF protection: block private IP ranges and localhost
        if (url == null || url.isBlank()) throw new BadRequestException("URL is required");
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            throw new BadRequestException("URL must use HTTP or HTTPS scheme");
        }
        String lower = url.toLowerCase();
        String[] blocked = {"localhost", "127.", "0.0.0.0", "192.168.", "10.", "172.16.", "169.254."};
        for (String b : blocked) {
            if (lower.contains(b)) throw new BadRequestException("URL points to a disallowed address");
        }
    }

    private ImportJobResponse mapJobToResponse(ImportJob job, QuizDraft draft) {
        return ImportJobResponse.builder()
                .jobId(job.getId())
                .draftId(draft != null ? draft.getId() : null)
                .jobStatus(job.getStatus())
                .draftStatus(draft != null ? draft.getStatus() : null)
                .title(draft != null ? draft.getTitle() : null)
                .createdAt(job.getCreatedAt())
                .completedAt(job.getCompletedAt())
                .build();
    }

    @FunctionalInterface
    interface AiCallable {
        AiParseResponse call() throws Exception;
    }
}
