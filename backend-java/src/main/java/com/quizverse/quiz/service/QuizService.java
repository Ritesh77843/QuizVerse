package com.quizverse.quiz.service;

import com.quizverse.common.exception.BadRequestException;
import com.quizverse.common.exception.ResourceNotFoundException;
import com.quizverse.common.exception.UnauthorizedException;
import com.quizverse.quiz.dto.QuizRequest;
import com.quizverse.quiz.dto.QuizResponse;
import com.quizverse.quiz.entity.Quiz;
import com.quizverse.quiz.entity.QuizStatus;
import com.quizverse.quiz.repository.QuizRepository;
import com.quizverse.question.repository.QuestionRepository;
import com.quizverse.user.entity.User;
import com.quizverse.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    @Transactional
    public QuizResponse createQuiz(QuizRequest request, UUID hostId) {
        User host = userRepository.findById(hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Host not found"));

        Quiz quiz = Quiz.builder()
                .host(host)
                .title(request.getTitle())
                .description(request.getDescription())
                .defaultTimeLimitSeconds(request.getDefaultTimeLimitSeconds())
                .scoringMode(request.getScoringMode())
                .coverImageUrl(request.getCoverImageUrl())
                .status(QuizStatus.DRAFT)
                .build();

        quiz = quizRepository.save(quiz);
        log.info("Quiz created: {} by host: {}", quiz.getId(), hostId);
        return mapToResponse(quiz);
    }

    @Transactional(readOnly = true)
    public Page<QuizResponse> getMyQuizzes(UUID hostId, Pageable pageable) {
        return quizRepository.findByHostId(hostId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public QuizResponse getQuiz(UUID quizId, UUID hostId) {
        Quiz quiz = quizRepository.findByIdAndHostId(quizId, hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        return mapToResponse(quiz);
    }

    @Transactional
    public QuizResponse updateQuiz(UUID quizId, QuizRequest request, UUID hostId) {
        Quiz quiz = quizRepository.findByIdAndHostId(quizId, hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setDefaultTimeLimitSeconds(request.getDefaultTimeLimitSeconds());
        quiz.setScoringMode(request.getScoringMode());
        quiz.setCoverImageUrl(request.getCoverImageUrl());

        quiz = quizRepository.save(quiz);
        return mapToResponse(quiz);
    }

    @Transactional
    public void deleteQuiz(UUID quizId, UUID hostId) {
        Quiz quiz = quizRepository.findByIdAndHostId(quizId, hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        quizRepository.delete(quiz);
        log.info("Quiz deleted: {} by host: {}", quizId, hostId);
    }

    @Transactional
    public QuizResponse publishQuiz(UUID quizId, UUID hostId) {
        Quiz quiz = quizRepository.findByIdAndHostId(quizId, hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        long questionCount = questionRepository.countByQuizId(quizId);
        if (questionCount == 0) {
            throw new BadRequestException("Cannot publish a quiz with no questions");
        }

        quiz.setStatus(QuizStatus.PUBLISHED);
        quiz = quizRepository.save(quiz);
        log.info("Quiz published: {}", quizId);
        return mapToResponse(quiz);
    }

    @Transactional
    public QuizResponse unpublishQuiz(UUID quizId, UUID hostId) {
        Quiz quiz = quizRepository.findByIdAndHostId(quizId, hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        quiz.setStatus(QuizStatus.DRAFT);
        quiz = quizRepository.save(quiz);
        return mapToResponse(quiz);
    }

    private QuizResponse mapToResponse(Quiz quiz) {
        long questionCount = questionRepository.countByQuizId(quiz.getId());
        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .status(quiz.getStatus())
                .defaultTimeLimitSeconds(quiz.getDefaultTimeLimitSeconds())
                .scoringMode(quiz.getScoringMode())
                .coverImageUrl(quiz.getCoverImageUrl())
                .hostId(quiz.getHost().getId())
                .hostDisplayName(quiz.getHost().getDisplayName())
                .questionCount(questionCount)
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .build();
    }
}
