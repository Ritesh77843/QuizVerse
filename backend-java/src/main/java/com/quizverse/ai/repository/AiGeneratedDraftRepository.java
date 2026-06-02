package com.quizverse.ai.repository;

import com.quizverse.ai.entity.AiGeneratedDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiGeneratedDraftRepository extends JpaRepository<AiGeneratedDraft, UUID> {
    Optional<AiGeneratedDraft> findByImportJobId(UUID importJobId);
}
