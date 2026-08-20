package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"os"

	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/config"
	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/database"
	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/domain"
	"github.com/amanuelt-cmyk/aspio_ethiopia/backend/internal/migrations"
)

//go:embed salons.json
var salonSeed []byte

func main() {
	var salons []domain.Salon
	if err := json.Unmarshal(salonSeed, &salons); err != nil {
		fail(err)
	}
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
	inserted := 0
	for _, item := range salons {
		result, err := pool.Exec(ctx, `INSERT INTO salons(slug,status,category,name_am,name_en,area_am,area_en,latitude,longitude,image_url,price_from_etb,rating,review_count,tag_am,tag_en,published_at) VALUES($1,'published',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now()) ON CONFLICT(slug) DO NOTHING`, item.Slug, item.Category, item.NameAM, item.NameEN, item.AreaAM, item.AreaEN, item.Latitude, item.Longitude, item.ImageURL, item.PriceFromETB, item.Rating, item.ReviewCount, item.TagAM, item.TagEN)
		if err != nil {
			fail(err)
		}
		inserted += int(result.RowsAffected())
	}
	fmt.Printf("seeded %d new salons (%d already existed)\n", inserted, len(salons)-inserted)
}
func fail(err error) { fmt.Fprintln(os.Stderr, err); os.Exit(1) }
