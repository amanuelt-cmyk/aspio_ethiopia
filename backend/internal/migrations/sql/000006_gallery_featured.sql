CREATE TABLE gallery_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind text NOT NULL CHECK (kind IN ('image', 'video')),
    status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    url text NOT NULL,
    mime_type text NOT NULL,
    original_name text NOT NULL DEFAULT '',
    title_am text NOT NULL DEFAULT '',
    title_en text NOT NULL DEFAULT '',
    caption_am text NOT NULL DEFAULT '',
    caption_en text NOT NULL DEFAULT '',
    size_bytes bigint NOT NULL CHECK (size_bytes > 0),
    sort_order integer NOT NULL DEFAULT 0,
    created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gallery_media_public_order_idx ON gallery_media (kind, status, sort_order, created_at DESC);

CREATE TABLE featured_places (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL UNIQUE REFERENCES salons(id) ON DELETE CASCADE,
    badge_am text NOT NULL DEFAULT '',
    badge_en text NOT NULL DEFAULT '',
    description_am text NOT NULL DEFAULT '',
    description_en text NOT NULL DEFAULT '',
    sort_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX featured_places_public_order_idx ON featured_places (active, sort_order, created_at);

INSERT INTO featured_places (salon_id, badge_am, badge_en, sort_order)
SELECT id, 'በአስፒዮ የተመረጠ', 'Aspio partner', ((row_number() OVER (ORDER BY sort_order, published_at DESC, id)) - 1)::integer
FROM salons
WHERE status = 'published' AND deleted_at IS NULL AND category IN ('salon', 'barbershop')
ORDER BY sort_order, published_at DESC, id
LIMIT 6
ON CONFLICT (salon_id) DO NOTHING;
