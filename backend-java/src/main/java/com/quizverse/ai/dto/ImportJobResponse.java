package com.quizverse.ai.dto;

import com.quizverse.ai.entity.DraftStatus;
import com.quizverse.ai.entity.ImportJobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ImportJobResponse {
    private UUID jobId;
    private UUID draftId;
    private ImportJobStatus jobStatus;
    private DraftStatus draftStatus;
    private String title;
    private Object parsedQuestions; // The draft raw_data questions array
    private OffsetDateTime createdAt;
    private OffsetDateTime completedAt;
}
