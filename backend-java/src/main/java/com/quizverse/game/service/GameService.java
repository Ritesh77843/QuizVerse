package com.quizverse.game.service;

import com.quizverse.common.exception.BadRequestException;
import com.quizverse.common.exception.ConflictException;
import com.quizverse.common.exception.ResourceNotFoundException;
import com.quizverse.game.dto.CreateGameRequest;
import com.quizverse.game.dto.GameSessionResponse;
import com.quizverse.game.dto.JoinGameRequest;
import com.quizverse.game.entity.GameSession;
import com.quizverse.game.entity.GameStatus;
import com.quizverse.game.repository.GameSessionRepository;
import com.quizverse.player.dto.PlayerDto;
import com.quizverse.player.entity.Player;
import com.quizverse.player.repository.PlayerRepository;
import com.quizverse.question.entity.Question;
import com.quizverse.question.repository.QuestionRepository;
import com.quizverse.quiz.entity.Quiz;
import com.quizverse.quiz.entity.QuizStatus;
import com.quizverse.quiz.repository.QuizRepository;
import com.quizverse.user.entity.User;
import com.quizverse.user.repository.UserRepository;
import com.quizverse.websocket.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameService {

    private final GameSessionRepository gameSessionRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;
    private final PinService pinService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public GameSessionResponse createSession(CreateGameRequest request, UUID hostId) {
        Quiz quiz = quizRepository.findByIdAndHostId(request.getQuizId(), hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            throw new BadRequestException("Only published quizzes can be started");
        }

        String pin = pinService.generateUniquePin();

        GameSession session = GameSession.builder()
                .quiz(quiz)
                .host(userRepository.findById(hostId)
                        .orElseThrow(() -> new ResourceNotFoundException("Host not found")))
                .pin(pin)
                .status(GameStatus.WAITING)
                .build();

        session = gameSessionRepository.save(session);
        log.info("Game session created with PIN: {} for quiz: {}", pin, quiz.getId());
        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public GameSessionResponse getSession(String pin) {
        GameSession session = gameSessionRepository.findByPin(pin)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with PIN: " + pin));
        return mapToResponse(session);
    }

    @Transactional
    public PlayerDto joinSession(String pin, JoinGameRequest request) {
        GameSession session = gameSessionRepository.findByPin(pin)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with PIN: " + pin));

        if (session.getStatus() != GameStatus.WAITING) {
            throw new BadRequestException("Game has already started. Cannot join.");
        }

        if (playerRepository.existsBySessionIdAndNickname(session.getId(), request.getNickname())) {
            throw new ConflictException("Nickname '" + request.getNickname() + "' is already taken in this game");
        }

        Player player = Player.builder()
                .session(session)
                .nickname(request.getNickname())
                .avatarSeed(request.getNickname().toLowerCase().replaceAll("\\s+", ""))
                .score(0)
                .build();

        player = playerRepository.save(player);
        long totalPlayers = playerRepository.countBySessionId(session.getId());

        // Broadcast player join to host
        messagingTemplate.convertAndSend(
                "/topic/player/" + pin,
                PlayerJoinEvent.builder()
                        .nickname(player.getNickname())
                        .avatarSeed(player.getAvatarSeed())
                        .totalPlayers((int) totalPlayers)
                        .build()
        );

        log.info("Player '{}' joined session PIN: {}", request.getNickname(), pin);

        return PlayerDto.builder()
                .id(player.getId())
                .nickname(player.getNickname())
                .avatarSeed(player.getAvatarSeed())
                .score(0)
                .sessionPin(pin)
                .build();
    }

    @Transactional
    public void startGame(String pin, UUID hostId) {
        GameSession session = getSessionByPinAndHost(pin, hostId);

        if (session.getStatus() != GameStatus.WAITING) {
            throw new BadRequestException("Game is not in WAITING state");
        }

        session.setStatus(GameStatus.ACTIVE);
        session.setStartedAt(OffsetDateTime.now());
        session.setCurrentQuestionIndex(0);
        gameSessionRepository.save(session);

        broadcastGameState(session);
        broadcastCurrentQuestion(session);
        log.info("Game started: PIN={}", pin);
    }

    @Transactional
    public void nextQuestion(String pin, UUID hostId) {
        GameSession session = getSessionByPinAndHost(pin, hostId);

        if (session.getStatus() != GameStatus.ACTIVE) {
            throw new BadRequestException("Game is not active");
        }

        List<Question> questions = questionRepository.findByQuizIdOrderByPositionAsc(session.getQuiz().getId());

        if (session.getCurrentQuestionIndex() + 1 >= questions.size()) {
            endGame(pin, hostId);
            return;
        }

        session.setCurrentQuestionIndex(session.getCurrentQuestionIndex() + 1);
        gameSessionRepository.save(session);

        broadcastGameState(session);
        broadcastCurrentQuestion(session);
        log.info("Advanced to question {}: PIN={}", session.getCurrentQuestionIndex(), pin);
    }

    @Transactional
    public void pauseGame(String pin, UUID hostId) {
        GameSession session = getSessionByPinAndHost(pin, hostId);
        session.setStatus(GameStatus.PAUSED);
        gameSessionRepository.save(session);
        broadcastGameState(session);
        log.info("Game paused: PIN={}", pin);
    }

    @Transactional
    public void resumeGame(String pin, UUID hostId) {
        GameSession session = getSessionByPinAndHost(pin, hostId);
        session.setStatus(GameStatus.ACTIVE);
        gameSessionRepository.save(session);
        broadcastGameState(session);
        log.info("Game resumed: PIN={}", pin);
    }

    @Transactional
    public void endGame(String pin, UUID hostId) {
        GameSession session = getSessionByPinAndHost(pin, hostId);
        session.setStatus(GameStatus.ENDED);
        session.setEndedAt(OffsetDateTime.now());

        // Persist final ranks to DB
        List<Player> players = playerRepository.findBySessionIdOrderByScoreDesc(session.getId());
        for (int i = 0; i < players.size(); i++) {
            players.get(i).setRank(i + 1);
        }
        playerRepository.saveAll(players);

        gameSessionRepository.save(session);
        broadcastGameState(session);
        log.info("Game ended: PIN={}", pin);
    }

    private GameSession getSessionByPinAndHost(String pin, UUID hostId) {
        GameSession session = gameSessionRepository.findByPin(pin)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found: " + pin));
        if (!session.getHost().getId().equals(hostId)) {
            throw new ResourceNotFoundException("Game not found: " + pin);
        }
        return session;
    }

    private void broadcastGameState(GameSession session) {
        long playerCount = playerRepository.countBySessionId(session.getId());
        List<Question> questions = questionRepository.findByQuizIdOrderByPositionAsc(session.getQuiz().getId());

        messagingTemplate.convertAndSend(
                "/topic/game/" + session.getPin(),
                GameStateEvent.builder()
                        .pin(session.getPin())
                        .status(session.getStatus())
                        .playerCount((int) playerCount)
                        .currentQuestionIndex(session.getCurrentQuestionIndex())
                        .totalQuestions(questions.size())
                        .build()
        );
    }

    private void broadcastCurrentQuestion(GameSession session) {
        List<Question> questions = questionRepository.findByQuizIdOrderByPositionAsc(session.getQuiz().getId());
        int idx = session.getCurrentQuestionIndex();

        if (idx < 0 || idx >= questions.size()) return;

        Question q = questions.get(idx);

        List<QuestionEvent.OptionItem> optionItems = q.getOptions().stream()
                .map(opt -> QuestionEvent.OptionItem.builder()
                        .id(opt.getId())
                        .text(opt.getOptionText())
                        .colorCode(opt.getColorCode())
                        .position(opt.getPosition())
                        .build())
                .toList();

        // IMPORTANT: correct answers are NOT included in the broadcast
        messagingTemplate.convertAndSend(
                "/topic/question/" + session.getPin(),
                QuestionEvent.builder()
                        .questionId(q.getId())
                        .index(idx)
                        .total(questions.size())
                        .questionText(q.getQuestionText())
                        .questionType(q.getQuestionType().name())
                        .timeLimitSeconds(q.getTimeLimitSeconds())
                        .points(q.getPoints())
                        .mediaUrl(q.getMediaUrl())
                        .options(optionItems)
                        .build()
        );
    }

    private GameSessionResponse mapToResponse(GameSession session) {
        long playerCount = playerRepository.countBySessionId(session.getId());
        long totalQuestions = questionRepository.countByQuizId(session.getQuiz().getId());

        return GameSessionResponse.builder()
                .id(session.getId())
                .pin(session.getPin())
                .quizId(session.getQuiz().getId())
                .quizTitle(session.getQuiz().getTitle())
                .hostId(session.getHost().getId())
                .status(session.getStatus())
                .currentQuestionIndex(session.getCurrentQuestionIndex())
                .totalQuestions((int) totalQuestions)
                .playerCount(playerCount)
                .startedAt(session.getStartedAt())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
