package com.quizverse.ai.service;

import com.quizverse.ai.dto.AiParseResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiHttpClient {

    private final RestTemplate restTemplate;

    @Value("${ai-service.base-url}")
    private String aiServiceBaseUrl;

    public AiParseResponse parseText(String text) {
        String url = aiServiceBaseUrl + "/ai/parse-text";
        Map<String, String> body = Map.of("text", text);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<AiParseResponse> response =
                    restTemplate.postForEntity(url, request, AiParseResponse.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("AI service parse-text failed: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
    }

    public AiParseResponse parsePdf(MultipartFile file) throws IOException {
        return uploadFile(file, "/ai/parse-pdf");
    }

    public AiParseResponse parseImage(MultipartFile file) throws IOException {
        return uploadFile(file, "/ai/parse-image");
    }

    public AiParseResponse parseUrl(String url) {
        String endpoint = aiServiceBaseUrl + "/ai/parse-url";
        Map<String, String> body = Map.of("url", url);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<AiParseResponse> response =
                    restTemplate.postForEntity(endpoint, request, AiParseResponse.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("AI service parse-url failed: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
    }

    private AiParseResponse uploadFile(MultipartFile file, String path) throws IOException {
        String url = aiServiceBaseUrl + path;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };
        body.add("file", resource);

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<AiParseResponse> response =
                    restTemplate.postForEntity(url, request, AiParseResponse.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("AI service {} failed: {}", path, e.getMessage());
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
    }
}
