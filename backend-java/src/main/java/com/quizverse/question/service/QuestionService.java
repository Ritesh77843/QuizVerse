package com.quizverse.question.service;

import com.quizverse.common.exception.BadRequestException;
import com.quizverse.common.exception.ResourceNotFoundException;
import com.quizverse.question.dto.OptionRequest;
import com.quizverse.question.dto.QuestionRequest;
import com.quizverse.question.dto.QuestionResponse;
import com.quizverse.question.entity.Option;
import com.quizverse.question.entity.Question;
import com.quizverse.question.repository.OptionRepository;
import com.quizverse.question.repository.QuestionRepository;
import com.quizverse.quiz.entity.Quiz;
import com.quizverse.quiz.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final OptionRepository optionRepository;
    private final QuizRepository quizRepository;

    @Transactional
    public QuestionResponse addQuestion(UUID quizId, QuestionRequest request, UUID hostId) {
        Quiz quiz = quizRepository.findByIdAndHostId(quizId, hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        validateOptions(request);

        long count = questionRepository.countByQuizId(quizId);
        int position = (int) count;

        Question question = Question.builder()
                .quiz(quiz)
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType())
                .timeLimitSeconds(request.getTimeLimitSeconds())
                .points(request.getPoints())
                .position(position)
                .mediaUrl(request.getMediaUrl())
                .build();

        List<Option> options = buildOptions(request.getOptions(), question);
        question.setOptions(options);
        question = questionRepository.save(question);

        log.info("Question added to quiz {}: position {}", quizId, position);
        return mapToResponse(question);
    }

    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestions(UUID quizId, UUID hostId) {
        quizRepository.findByIdAndHostId(quizId, hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        return questionRepository.findByQuizIdOrderByPositionAsc(quizId)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public QuestionResponse updateQuestion(UUID quizId, UUID questionId, QuestionRequest request, UUID hostId) {
        quizRepository.findByIdAndHostId(quizId, hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        if (!question.getQuiz().getId().equals(quizId)) {
            throw new ResourceNotFoundException("Question not found in this quiz");
        }

        validateOptions(request);

        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setTimeLimitSeconds(request.getTimeLimitSeconds());
        question.setPoints(request.getPoints());
        question.setMediaUrl(request.getMediaUrl());

        // Replace options
        optionRepository.deleteByQuestionId(questionId);
        List<Option> options = buildOptions(request.getOptions(), question);
        question.setOptions(options);

        question = questionRepository.save(question);
        return mapToResponse(question);
    }

    @Transactional
    public void deleteQuestion(UUID quizId, UUID questionId, UUID hostId) {
        quizRepository.findByIdAndHostId(quizId, hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        questionRepository.delete(question);
        log.info("Question deleted: {} from quiz: {}", questionId, quizId);
    }

    private void validateOptions(QuestionRequest request) {
        boolean hasCorrect = request.getOptions().stream().anyMatch(OptionRequest::isCorrect);
        if (!hasCorrect) {
            throw new BadRequestException("At least one option must be marked as correct");
        }
    }

    private List<Option> buildOptions(List<OptionRequest> optionRequests, Question question) {
        List<Option> options = new ArrayList<>();
        for (int i = 0; i < optionRequests.size(); i++) {
            OptionRequest req = optionRequests.get(i);
            options.add(Option.builder()
                    .question(question)
                    .optionText(req.getOptionText())
                    .isCorrect(req.isCorrect())
                    .position(i)
                    .colorCode(req.getColorCode())
                    .build());
        }
        return options;
    }

    private QuestionResponse mapToResponse(Question question) {
        List<QuestionResponse.OptionResponse> optionResponses = question.getOptions().stream()
                .map(opt -> QuestionResponse.OptionResponse.builder()
                        .id(opt.getId())
                        .optionText(opt.getOptionText())
                        .isCorrect(opt.isCorrect())
                        .position(opt.getPosition())
                        .colorCode(opt.getColorCode())
                        .build())
                .toList();

        return QuestionResponse.builder()
                .id(question.getId())
                .quizId(question.getQuiz().getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .timeLimitSeconds(question.getTimeLimitSeconds())
                .points(question.getPoints())
                .position(question.getPosition())
                .mediaUrl(question.getMediaUrl())
                .options(optionResponses)
                .createdAt(question.getCreatedAt())
                .build();
    }
}
