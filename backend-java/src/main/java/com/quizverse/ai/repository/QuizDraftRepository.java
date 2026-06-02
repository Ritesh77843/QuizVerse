package com.quizverse.ai.repository;

import com.quizverse.ai.entity.QuizDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizDraftRepository extends JpaRepository<QuizDraft, UUID> {
    List<QuizDraft> findByHostIdOrderByCreatedAtDesc(UUID hostId);
    Optional<QuizDraft> findByIdAndHostId(UUID id, UUID hostId);
}
