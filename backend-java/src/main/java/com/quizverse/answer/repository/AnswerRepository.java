package com.quizverse.answer.repository;

import com.quizverse.answer.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, UUID> {

    boolean existsByPlayerIdAndQuestionIdAndSessionId(UUID playerId, UUID questionId, UUID sessionId);

    Optional<Answer> findByPlayerIdAndQuestionIdAndSessionId(UUID playerId, UUID questionId, UUID sessionId);

    List<Answer> findBySessionId(UUID sessionId);

    List<Answer> findByQuestionId(UUID questionId);

    @Query("SELECT COUNT(a) FROM Answer a WHERE a.question.id = :questionId AND a.session.id = :sessionId AND a.isCorrect = true")
    long countCorrectByQuestionAndSession(UUID questionId, UUID sessionId);

    @Query("SELECT COUNT(a) FROM Answer a WHERE a.question.id = :questionId AND a.session.id = :sessionId")
    long countTotalByQuestionAndSession(UUID questionId, UUID sessionId);
}
