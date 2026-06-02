-- ============================================================
-- QuizVerse — Initial Schema Migration
-- V1__init_schema.sql
-- ============================================================

-- ===== EXTENSIONS =====
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== ENUM TYPES =====
CREATE TYPE user_role AS ENUM ('HOST', 'ADMIN');
CREATE TYPE quiz_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE scoring_mode AS ENUM ('STANDARD', 'NO_PENALTY', 'CUSTOM');
CREATE TYPE question_type AS ENUM ('SINGLE_CHOICE', 'MULTI_CHOICE', 'TRUE_FALSE');
CREATE TYPE game_status AS ENUM ('WAITING', 'ACTIVE', 'PAUSED', 'ENDED');
CREATE TYPE import_source_type AS ENUM ('TEXT', 'PDF', 'IMAGE', 'URL');
CREATE TYPE import_job_status AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE draft_status AS ENUM ('PENDING_REVIEW', 'APPROVED', 'DISCARDED');

-- ===== USERS =====
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    role          user_role NOT NULL DEFAULT 'HOST',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ===== REFRESH TOKENS =====
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(512) NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token  ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user   ON refresh_tokens(user_id);

-- ===== QUIZZES =====
CREATE TABLE quizzes (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id                    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                      VARCHAR(255) NOT NULL,
    description                TEXT,
    status                     quiz_status NOT NULL DEFAULT 'DRAFT',
    default_time_limit_seconds INT NOT NULL DEFAULT 30,
    scoring_mode               scoring_mode NOT NULL DEFAULT 'STANDARD',
    cover_image_url            VARCHAR(512),
    created_at                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quizzes_host   ON quizzes(host_id);
CREATE INDEX idx_quizzes_status ON quizzes(status);

-- ===== QUESTIONS =====
CREATE TABLE questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id             UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text       TEXT NOT NULL,
    question_type       question_type NOT NULL DEFAULT 'SINGLE_CHOICE',
    time_limit_seconds  INT NOT NULL DEFAULT 30,
    points              INT NOT NULL DEFAULT 1000,
    position            INT NOT NULL DEFAULT 0,
    media_url           VARCHAR(512),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_quiz      ON questions(quiz_id);
CREATE INDEX idx_questions_quiz_pos  ON questions(quiz_id, position);

-- ===== OPTIONS =====
CREATE TABLE options (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id  UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text  TEXT NOT NULL,
    is_correct   BOOLEAN NOT NULL DEFAULT FALSE,
    position     INT NOT NULL DEFAULT 0,
    color_code   VARCHAR(7)   -- hex color for Kahoot-style buttons
);

CREATE INDEX idx_options_question ON options(question_id);

-- ===== IMPORT JOBS =====
CREATE TABLE import_jobs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type   import_source_type NOT NULL,
    source_ref    VARCHAR(1024),
    status        import_job_status NOT NULL DEFAULT 'QUEUED',
    error_message TEXT,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at  TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_import_jobs_host   ON import_jobs(host_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);

-- ===== QUIZ DRAFTS =====
CREATE TABLE quiz_drafts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    import_job_id  UUID REFERENCES import_jobs(id) ON DELETE SET NULL,
    title          VARCHAR(255),
    raw_data       JSONB NOT NULL DEFAULT '{}',
    status         draft_status NOT NULL DEFAULT 'PENDING_REVIEW',
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_drafts_host   ON quiz_drafts(host_id);
CREATE INDEX idx_quiz_drafts_status ON quiz_drafts(status);

-- ===== AI GENERATED DRAFTS =====
CREATE TABLE ai_generated_drafts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_job_id     UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    quiz_draft_id     UUID REFERENCES quiz_drafts(id) ON DELETE SET NULL,
    raw_response      JSONB NOT NULL DEFAULT '{}',
    confidence_scores JSONB,
    approved_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at       TIMESTAMP WITH TIME ZONE,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_drafts_import_job ON ai_generated_drafts(import_job_id);

-- ===== GAME SESSIONS =====
CREATE TABLE game_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id                 UUID NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
    host_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pin                     VARCHAR(10) NOT NULL UNIQUE,
    status                  game_status NOT NULL DEFAULT 'WAITING',
    current_question_index  INT NOT NULL DEFAULT -1,
    started_at              TIMESTAMP WITH TIME ZONE,
    ended_at                TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_pin    ON game_sessions(pin);
CREATE INDEX idx_sessions_host   ON game_sessions(host_id);
CREATE INDEX idx_sessions_status ON game_sessions(status);

-- ===== PLAYERS =====
CREATE TABLE players (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    nickname         VARCHAR(50) NOT NULL,
    avatar_seed      VARCHAR(100),
    score            INT NOT NULL DEFAULT 0,
    rank             INT,
    connected_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    disconnected_at  TIMESTAMP WITH TIME ZONE,
    UNIQUE(session_id, nickname)
);

CREATE INDEX idx_players_session ON players(session_id);
CREATE INDEX idx_players_score   ON players(session_id, score DESC);

-- ===== ANSWERS =====
CREATE TABLE answers (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id          UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    question_id        UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    session_id         UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES options(id) ON DELETE SET NULL,
    is_correct         BOOLEAN NOT NULL DEFAULT FALSE,
    points_awarded     INT NOT NULL DEFAULT 0,
    response_time_ms   INT,
    submitted_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, question_id, session_id)
);

CREATE INDEX idx_answers_player   ON answers(player_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_session  ON answers(session_id);

-- ===== AUTO-UPDATE updated_at =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at    BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at  BEFORE UPDATE ON quizzes        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quiz_drafts_updated_at BEFORE UPDATE ON quiz_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
