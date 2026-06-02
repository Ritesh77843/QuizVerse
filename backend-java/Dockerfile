# ===== STAGE 1: Build =====
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN apk add --no-cache maven && \
    mvn clean package -DskipTests -q

# ===== STAGE 2: Runtime =====
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Create non-root user for security
RUN addgroup -S quizverse && adduser -S quizverse -G quizverse

# Create upload directory
RUN mkdir -p /app/uploads && chown quizverse:quizverse /app/uploads

COPY --from=builder /app/target/*.jar app.jar

RUN chown quizverse:quizverse app.jar

USER quizverse

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/actuator/health || exit 1

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
