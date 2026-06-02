package com.quizverse.question.repository;

import com.quizverse.question.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {

    List<Question> findByQuizIdOrderByPositionAsc(UUID quizId);

    long countByQuizId(UUID quizId);

    @Modifying
    @Query("UPDATE Question q SET q.position = :position WHERE q.id = :id")
    void updatePosition(UUID id, int position);
}
