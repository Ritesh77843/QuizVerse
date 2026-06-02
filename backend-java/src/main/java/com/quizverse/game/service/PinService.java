package com.quizverse.game.service;

import com.quizverse.game.repository.GameSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class PinService {

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Unambiguous chars
    private static final int PIN_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();
    private final GameSessionRepository gameSessionRepository;

    public String generateUniquePin() {
        String pin;
        int attempts = 0;
        do {
            pin = generatePin();
            attempts++;
            if (attempts > 100) {
                throw new RuntimeException("Could not generate a unique PIN after 100 attempts");
            }
        } while (gameSessionRepository.existsByPin(pin));
        return pin;
    }

    private String generatePin() {
        StringBuilder sb = new StringBuilder(PIN_LENGTH);
        for (int i = 0; i < PIN_LENGTH; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}
