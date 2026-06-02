package com.quizverse.ai.dto;

import lombok.Data;

import java.util.List;

@Data
public class AiParseResponse {

    private List<AiQuestion> questions;

    @Data
    public static class AiQuestion {
        private String question;
        private List<String> options;
        private int correctAnswer;
        private double confidence;
    }
}
