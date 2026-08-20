CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    name text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor')),
    active boolean NOT NULL DEFAULT true,
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX admin_users_email_unique ON admin_users (lower(email));

CREATE TABLE admin_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_sessions_expiry_idx ON admin_sessions (expires_at);

CREATE TABLE salons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    category text NOT NULL CHECK (category IN ('salon', 'barbershop', 'spa', 'nails', 'wellness', 'other')),
    name_am text NOT NULL,
    name_en text NOT NULL,
    description_am text NOT NULL DEFAULT '',
    description_en text NOT NULL DEFAULT '',
    area_am text NOT NULL,
    area_en text NOT NULL,
    address text NOT NULL DEFAULT '',
    latitude numeric(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude numeric(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    phone text NOT NULL DEFAULT '',
    email text NOT NULL DEFAULT '',
    website_url text NOT NULL DEFAULT '',
    booking_url text NOT NULL DEFAULT '',
    image_url text NOT NULL DEFAULT '',
    price_from_etb integer CHECK (price_from_etb IS NULL OR price_from_etb >= 0),
    rating numeric(2,1) CHECK (rating IS NULL OR rating BETWEEN 0 AND 5),
    review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    tag_am text NOT NULL DEFAULT '',
    tag_en text NOT NULL DEFAULT '',
    opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
    amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
    sort_order integer NOT NULL DEFAULT 0,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX salons_public_idx ON salons (status, published_at DESC, sort_order, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX salons_location_idx ON salons (latitude, longitude) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX salons_area_en_idx ON salons (lower(area_en)) WHERE deleted_at IS NULL;

CREATE TABLE blog_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    title_am text NOT NULL,
    title_en text NOT NULL,
    excerpt_am text NOT NULL DEFAULT '',
    excerpt_en text NOT NULL DEFAULT '',
    content_am text NOT NULL DEFAULT '',
    content_en text NOT NULL DEFAULT '',
    cover_image_url text NOT NULL DEFAULT '',
    author_name text NOT NULL DEFAULT 'Aspio',
    tags text[] NOT NULL DEFAULT '{}',
    seo_title_am text NOT NULL DEFAULT '',
    seo_title_en text NOT NULL DEFAULT '',
    seo_description_am text NOT NULL DEFAULT '',
    seo_description_en text NOT NULL DEFAULT '',
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX blog_posts_public_idx ON blog_posts (published_at DESC) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX blog_posts_tags_idx ON blog_posts USING gin(tags);

CREATE TABLE leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind text NOT NULL CHECK (kind IN ('demo', 'contact')),
    source text NOT NULL,
    locale text NOT NULL DEFAULT 'am-ET',
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    business_name text NOT NULL DEFAULT '',
    message text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed', 'spam')),
    email_status text NOT NULL DEFAULT 'queued' CHECK (email_status IN ('queued', 'sent', 'failed')),
    ip_hash text NOT NULL DEFAULT '',
    user_agent text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_created_idx ON leads (created_at DESC);
CREATE INDEX leads_status_idx ON leads (status, created_at DESC);

CREATE TABLE delivery_jobs (
    id bigserial PRIMARY KEY,
    kind text NOT NULL CHECK (kind IN ('lead.email', 'lead.crm')),
    aggregate_id uuid NOT NULL,
    payload jsonb NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'dead')),
    attempts integer NOT NULL DEFAULT 0,
    available_at timestamptz NOT NULL DEFAULT now(),
    locked_at timestamptz,
    last_error text NOT NULL DEFAULT '',
    provider_id text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX delivery_jobs_claim_idx ON delivery_jobs (available_at, id) WHERE status IN ('pending', 'processing');
CREATE UNIQUE INDEX delivery_jobs_unique_kind_aggregate ON delivery_jobs (kind, aggregate_id);

