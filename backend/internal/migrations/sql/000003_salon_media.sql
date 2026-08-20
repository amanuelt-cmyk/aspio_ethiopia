CREATE TABLE salon_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    kind text NOT NULL CHECK (kind IN ('image', 'video')),
    url text NOT NULL,
    mime_type text NOT NULL,
    original_name text NOT NULL DEFAULT '',
    alt_text text NOT NULL DEFAULT '',
    size_bytes bigint NOT NULL CHECK (size_bytes > 0),
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX salon_media_salon_order_idx ON salon_media (salon_id, sort_order, created_at);
