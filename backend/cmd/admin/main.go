package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/aspio-se/aspio-backend/internal/config"
	"github.com/aspio-se/aspio-backend/internal/database"
	"github.com/aspio-se/aspio-backend/internal/domain"
	"github.com/aspio-se/aspio-backend/internal/migrations"
	"github.com/aspio-se/aspio-backend/internal/security"
	"github.com/aspio-se/aspio-backend/internal/store"
)

func main() {
	email := flag.String("email", "", "admin email address")
	name := flag.String("name", "", "admin display name")
	role := flag.String("role", "super_admin", "super_admin or admin")
	flag.Parse()
	password := os.Getenv("ASPIO_ADMIN_PASSWORD")
	if *email == "" || *name == "" || len(password) < 12 || !domain.ValidAdminRole(*role) {
		fail("provide -email, -name, a valid -role, and ASPIO_ADMIN_PASSWORD of at least 12 characters")
	}
	hash, err := security.HashPassword(password)
	if err != nil {
		fail(err.Error())
	}
	ctx := context.Background()
	cfg, err := config.Load()
	if err != nil {
		fail(err.Error())
	}
	pool, err := database.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		fail(err.Error())
	}
	defer pool.Close()
	if err := migrations.Up(ctx, pool); err != nil {
		fail(err.Error())
	}
	user, err := store.New(pool).CreateAdmin(ctx, strings.ToLower(strings.TrimSpace(*email)), strings.TrimSpace(*name), "", "", hash, *role)
	if err != nil {
		fail(err.Error())
	}
	fmt.Printf("created %s admin %s (%s)\n", user.Role, user.Name, user.Email)
}
func fail(message string) { fmt.Fprintln(os.Stderr, message); os.Exit(1) }
