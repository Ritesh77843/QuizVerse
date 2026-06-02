package com.quizverse.ai.repository;

import com.quizverse.ai.entity.ImportJob;
import com.quizverse.ai.entity.ImportJobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ImportJobRepository extends JpaRepository<ImportJob, UUID> {
    List<ImportJob> findByHostIdOrderByCreatedAtDesc(UUID hostId);
    List<ImportJob> findByStatus(ImportJobStatus status);
}
