package store

import (
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("record not found")
var ErrCannotModifyOwnAccess = errors.New("cannot modify own access")
var ErrLastSuperAdmin = errors.New("cannot remove the last active super admin")

type Store struct {
	Pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Store {
	return &Store{Pool: pool}
}

func translateError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	return err
}
