ALTER TABLE admin_users
    ADD COLUMN phone text NOT NULL DEFAULT '',
    ADD COLUMN job_title text NOT NULL DEFAULT '',
    ADD COLUMN avatar_url text NOT NULL DEFAULT '';
