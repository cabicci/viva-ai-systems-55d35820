-- Just delete old rows from tables with unique constraint on (user_id, lesson_id) — safer than handling conflicts
DELETE FROM user_lesson_status WHERE lesson_id='intro-m1-first-prompt';
DELETE FROM lesson_progress WHERE lesson_id='intro-m1-first-prompt';
DELETE FROM lesson_feedback WHERE lesson_id='intro-m1-first-prompt';
DELETE FROM lesson_notes WHERE lesson_id='intro-m1-first-prompt';
DELETE FROM lesson_review_schedule WHERE lesson_id='intro-m1-first-prompt';

-- Tables without that unique constraint: rename in place
UPDATE learner_events SET lesson_id='intro-m1-l2-first-prompt' WHERE lesson_id='intro-m1-first-prompt';
UPDATE lesson_quiz_attempts SET lesson_id=REPLACE(lesson_id,'intro-m1-first-prompt','intro-m1-l2-first-prompt') WHERE lesson_id LIKE 'intro-m1-first-prompt%';
UPDATE mission_submissions SET lesson_id=REPLACE(lesson_id,'intro-m1-first-prompt','intro-m1-l2-first-prompt') WHERE lesson_id LIKE 'intro-m1-first-prompt%';
UPDATE build_logs SET lesson_id=REPLACE(lesson_id,'intro-m1-first-prompt','intro-m1-l2-first-prompt') WHERE lesson_id LIKE 'intro-m1-first-prompt%';
UPDATE knowledge_chunks SET lesson_id='intro-m1-l2-first-prompt' WHERE lesson_id='intro-m1-first-prompt';

UPDATE roadmap_items
SET status='in_progress',
    notes=COALESCE(notes,'') || E'\n[ai-edit 2026-06-02]: [scope:lessons] rename intro-m1-first-prompt → intro-m1-l2-first-prompt + v2 content (Tension-First, concepts 6→4, simpler mission)',
    updated_at=now()
WHERE id='018a96a7-ebeb-4706-a5b0-445bdfff594c';