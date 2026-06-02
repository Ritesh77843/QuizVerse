package com.quizverse.quiz.repository;

import com.quizverse.quiz.entity.Quiz;
import com.quizverse.quiz.entity.QuizStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {

    Page<Quiz> findByHostId(UUID hostId, Pageable pageable);

    Page<Quiz> findByHostIdAndStatus(UUID hostId, QuizStatus status, Pageable pageable);

    Optional<Quiz> findByIdAndHostId(UUID id, UUID hostId);
}
