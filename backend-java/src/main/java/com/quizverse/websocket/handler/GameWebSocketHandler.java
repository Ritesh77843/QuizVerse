package com.quizverse.websocket.handler;

import com.quizverse.answer.service.AnswerService;
import com.quizverse.auth.service.JwtService;
import com.quizverse.common.exception.BadRequestException;
import com.quizverse.common.exception.ResourceNotFoundException;
import com.quizverse.game.service.GameService;
import com.quizverse.user.repository.UserRepository;
import com.quizverse.websocket.dto.AnswerSubmitCommand;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class GameWebSocketHandler {

    private final GameService gameService;
    private final AnswerService answerService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @MessageMapping("/game/start")
    public void startGame(@Payload String pin, Authentication auth) {
        UUID hostId = extractHostId(auth);
        gameService.startGame(pin.replaceAll("\"", ""), hostId);
        log.debug("WS start game PIN: {}", pin);
    }

    @MessageMapping("/game/next")
    public void nextQuestion(@Payload String pin, Authentication auth) {
        UUID hostId = extractHostId(auth);
        gameService.nextQuestion(pin.replaceAll("\"", ""), hostId);
        log.debug("WS next question PIN: {}", pin);
    }

    @MessageMapping("/game/pause")
    public void pauseGame(@Payload String pin, Authentication auth) {
        UUID hostId = extractHostId(auth);
        gameService.pauseGame(pin.replaceAll("\"", ""), hostId);
    }

    @MessageMapping("/game/resume")
    public void resumeGame(@Payload String pin, Authentication auth) {
        UUID hostId = extractHostId(auth);
        gameService.resumeGame(pin.replaceAll("\"", ""), hostId);
    }

    @MessageMapping("/game/end")
    public void endGame(@Payload String pin, Authentication auth) {
        UUID hostId = extractHostId(auth);
        gameService.endGame(pin.replaceAll("\"", ""), hostId);
    }

    @MessageMapping("/answer/submit")
    public void submitAnswer(@Payload AnswerSubmitCommand command) {
        answerService.submitAnswer(command);
        log.debug("WS answer submitted by player: {}", command.getPlayerId());
    }

    /**
     * Resolves the host's UUID from the authenticated WebSocket principal.
     * The email is stored as the principal name (set by WebSocketAuthInterceptor);
     * we look up the user by email to get the UUID.
     */
    private UUID extractHostId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new BadRequestException("Authentication required for this action");
        }
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"))
                .getId();
    }
}
