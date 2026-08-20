package store

import (
	"context"
	"strings"
	"time"

	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/domain"
)

const adminColumns = `id::text, email, name, phone, job_title, avatar_url, password_hash, role, active, last_login_at, created_at, updated_at`

func scanAdmin(row interface{ Scan(...any) error }) (domain.AdminUser, error) {
	var user domain.AdminUser
	err := row.Scan(&user.ID, &user.Email, &user.Name, &user.Phone, &user.JobTitle, &user.AvatarURL, &user.PasswordHash, &user.Role, &user.Active, &user.LastLoginAt, &user.CreatedAt, &user.UpdatedAt)
	return user, translateError(err)
}

func (s *Store) GetAdminByEmail(ctx context.Context, email string) (domain.AdminUser, error) {
	return scanAdmin(s.Pool.QueryRow(ctx, `SELECT `+adminColumns+` FROM admin_users WHERE lower(email)=lower($1)`, strings.TrimSpace(email)))
}

func (s *Store) GetAdminBySession(ctx context.Context, tokenHash string) (domain.AdminUser, error) {
	return scanAdmin(s.Pool.QueryRow(ctx, `
		SELECT u.id::text, u.email, u.name, u.phone, u.job_title, u.avatar_url, u.password_hash, u.role, u.active, u.last_login_at, u.created_at, u.updated_at
		FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id
		WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`, tokenHash))
}

func (s *Store) UpdateAdminProfile(ctx context.Context, id, email, name, phone, jobTitle string) (domain.AdminUser, error) {
	return scanAdmin(s.Pool.QueryRow(ctx, `
		UPDATE admin_users SET email=lower($2),name=$3,phone=$4,job_title=$5,updated_at=now()
		WHERE id=$1 AND active=true RETURNING `+adminColumns, id, strings.TrimSpace(email), strings.TrimSpace(name), strings.TrimSpace(phone), strings.TrimSpace(jobTitle)))
}

func (s *Store) UpdateAdminAvatar(ctx context.Context, id, avatarURL string) (domain.AdminUser, error) {
	return scanAdmin(s.Pool.QueryRow(ctx, `
		UPDATE admin_users SET avatar_url=$2,updated_at=now()
		WHERE id=$1 AND active=true RETURNING `+adminColumns, id, avatarURL))
}

func (s *Store) CreateAdmin(ctx context.Context, email, name, phone, jobTitle, passwordHash, role string) (domain.AdminUser, error) {
	return scanAdmin(s.Pool.QueryRow(ctx, `
		INSERT INTO admin_users(email,name,phone,job_title,password_hash,role)
		VALUES(lower($1),$2,$3,$4,$5,$6)
		RETURNING `+adminColumns, strings.TrimSpace(email), strings.TrimSpace(name), strings.TrimSpace(phone), strings.TrimSpace(jobTitle), passwordHash, role))
}

func (s *Store) ListAdmins(ctx context.Context) ([]domain.AdminUser, error) {
	rows, err := s.Pool.Query(ctx, `SELECT `+adminColumns+` FROM admin_users ORDER BY active DESC, role='super_admin' DESC, name, created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.AdminUser{}
	for rows.Next() {
		user, scanErr := scanAdmin(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		items = append(items, user)
	}
	return items, rows.Err()
}

func (s *Store) GetAdminByID(ctx context.Context, id string) (domain.AdminUser, error) {
	return scanAdmin(s.Pool.QueryRow(ctx, `SELECT `+adminColumns+` FROM admin_users WHERE id=$1`, id))
}

func (s *Store) UpdateAdminAccount(ctx context.Context, actorID, id, email, name, phone, jobTitle, role string, active bool) (domain.AdminUser, error) {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return domain.AdminUser{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if _, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(68312005)`); err != nil {
		return domain.AdminUser{}, err
	}
	target, err := scanAdmin(tx.QueryRow(ctx, `SELECT `+adminColumns+` FROM admin_users WHERE id=$1 FOR UPDATE`, id))
	if err != nil {
		return domain.AdminUser{}, err
	}
	if target.ID == actorID && (!active || role != domain.AdminRoleSuperAdmin) {
		return domain.AdminUser{}, ErrCannotModifyOwnAccess
	}
	if target.Active && target.Role == domain.AdminRoleSuperAdmin && (!active || role != domain.AdminRoleSuperAdmin) {
		var count int
		if err = tx.QueryRow(ctx, `SELECT count(*) FROM admin_users WHERE active=true AND role='super_admin'`).Scan(&count); err != nil {
			return domain.AdminUser{}, err
		}
		if count <= 1 {
			return domain.AdminUser{}, ErrLastSuperAdmin
		}
	}
	updated, err := scanAdmin(tx.QueryRow(ctx, `
		UPDATE admin_users SET email=lower($2),name=$3,phone=$4,job_title=$5,role=$6,active=$7,updated_at=now()
		WHERE id=$1 RETURNING `+adminColumns, id, strings.TrimSpace(email), strings.TrimSpace(name), strings.TrimSpace(phone), strings.TrimSpace(jobTitle), role, active))
	if err != nil {
		return domain.AdminUser{}, err
	}
	if !active {
		if _, err = tx.Exec(ctx, `DELETE FROM admin_sessions WHERE user_id=$1`, id); err != nil {
			return domain.AdminUser{}, err
		}
	}
	if err = tx.Commit(ctx); err != nil {
		return domain.AdminUser{}, err
	}
	return updated, nil
}

func (s *Store) ResetAdminPassword(ctx context.Context, id, passwordHash string) error {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	result, err := tx.Exec(ctx, `UPDATE admin_users SET password_hash=$2,updated_at=now() WHERE id=$1`, id, passwordHash)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	if _, err = tx.Exec(ctx, `DELETE FROM admin_sessions WHERE user_id=$1`, id); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (s *Store) CreateSession(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	_, err := s.Pool.Exec(ctx, `
		WITH created AS (
			INSERT INTO admin_sessions(user_id,token_hash,expires_at) VALUES($1,$2,$3)
		)
		UPDATE admin_users SET last_login_at=now(), updated_at=now() WHERE id=$1`, userID, tokenHash, expiresAt)
	return err
}

func (s *Store) DeleteSession(ctx context.Context, tokenHash string) error {
	_, err := s.Pool.Exec(ctx, `DELETE FROM admin_sessions WHERE token_hash=$1`, tokenHash)
	return err
}

func (s *Store) DeleteExpiredSessions(ctx context.Context) error {
	_, err := s.Pool.Exec(ctx, `DELETE FROM admin_sessions WHERE expires_at<=now()`)
	return err
}
