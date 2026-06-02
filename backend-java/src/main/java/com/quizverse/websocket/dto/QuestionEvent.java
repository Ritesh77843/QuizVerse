package com.quizverse.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class QuestionEvent {
    private UUID questionId;
    private int index;
    private int total;
    private String questionText;
    private String questionType;
    private int timeLimitSeconds;
    private int points;
    private String mediaUrl;
    private List<OptionItem> options;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OptionItem {
        private UUID id;
        private String text;
        private String colorCode;
        private int position;
    }
}
