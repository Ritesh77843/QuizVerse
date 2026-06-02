package com.quizverse.user.controller;

import com.quizverse.auth.service.JwtService;
import com.quizverse.common.dto.ApiResponse;
import com.quizverse.user.dto.UpdateUserRequest;
import com.quizverse.user.dto.UserDto;
import com.quizverse.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Host profile management")
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;

    private UUID extractUserId(String authHeader) {
        return jwtService.extractUserId(authHeader.substring(7));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserDto>> getMyProfile(
            @RequestHeader("Authorization") String authHeader) {
        UUID userId = extractUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved",
                userService.getProfile(userId)));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody UpdateUserRequest request) {
        UUID userId = extractUserId(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Profile updated",
                userService.updateProfile(userId, request)));
    }
}
