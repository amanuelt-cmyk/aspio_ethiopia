package main

import (
	"context"
	"fmt"
	"os"

	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/config"
	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/database"
	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/migrations"
)

func main() {
	ctx := context.Background()
	cfg, err := config.Load()
	if err != nil {
		fail(err)
	}
	pool, err := database.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		fail(err)
	}
	defer pool.Close()
	if err := migrations.Up(ctx, pool); err != nil {
		fail(err)
	}
	fmt.Println("database migrations are up to date")
}
func fail(err error) { fmt.Fprintln(os.Stderr, err); os.Exit(1) }
