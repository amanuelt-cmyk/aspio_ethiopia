ALTER TABLE admin_users
    DROP CONSTRAINT IF EXISTS admin_users_role_check;

UPDATE admin_users
SET role = CASE
    WHEN id = (
        SELECT id
        FROM admin_users
        WHERE role = 'owner'
        ORDER BY last_login_at DESC NULLS LAST, created_at
        LIMIT 1
    ) THEN 'super_admin'
    ELSE 'admin'
END,
updated_at = now()
WHERE role IN ('owner', 'editor');

ALTER TABLE admin_users
    ADD CONSTRAINT admin_users_role_check
    CHECK (role IN ('super_admin', 'admin'));
