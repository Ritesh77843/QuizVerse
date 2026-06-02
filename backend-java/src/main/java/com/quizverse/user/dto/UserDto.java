package com.quizverse.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserDto {
    private UUID id;
    private String email;
    private String displayName;
    private String role;
    private boolean isActive;
    private OffsetDateTime createdAt;
}
