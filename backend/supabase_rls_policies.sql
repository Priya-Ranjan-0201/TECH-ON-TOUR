-- ==============================================================================
-- TravelSathi (DESHORA) — Supabase PostgreSQL Row Level Security (RLS) Policies
-- Production Security Hardening & Zero-Trust Access Control
-- ==============================================================================

-- 1. Helper Function: Extract User Role from JWT
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS text AS $$
  SELECT coalesce(
    auth.jwt() ->> 'role',
    (auth.jwt() -> 'user_metadata' ->> 'role')::text,
    'tourist'
  );
$$ LANGUAGE sql STABLE;

-- ==============================================================================
-- 2. Destinations Master (Catalog)
-- Everyone can view verified destinations; only DMO and Admin can modify.
-- ==============================================================================
ALTER TABLE destinations_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read destinations"
  ON destinations_master FOR SELECT
  USING (true);

CREATE POLICY "DMO and Admin insert destinations"
  ON destinations_master FOR INSERT
  WITH CHECK (auth.user_role() IN ('admin', 'dmo'));

CREATE POLICY "DMO and Admin update destinations"
  ON destinations_master FOR UPDATE
  USING (auth.user_role() IN ('admin', 'dmo'));

CREATE POLICY "Admin delete destinations"
  ON destinations_master FOR DELETE
  USING (auth.user_role() = 'admin');

-- ==============================================================================
-- 3. Homestays (PM-JUGA & Local Listings)
-- Public can browse verified homestays. Hosts can only manage their own homestays.
-- ==============================================================================
ALTER TABLE homestays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read verified homestays"
  ON homestays FOR SELECT
  USING (is_verified = true OR host_id = auth.uid()::text OR auth.user_role() IN ('admin', 'dmo'));

CREATE POLICY "Hosts can create listings"
  ON homestays FOR INSERT
  WITH CHECK (auth.user_role() IN ('host', 'admin') AND host_id = auth.uid()::text);

CREATE POLICY "Hosts can update own listings"
  ON homestays FOR UPDATE
  USING (host_id = auth.uid()::text OR auth.user_role() = 'admin');

CREATE POLICY "Admin only delete listings"
  ON homestays FOR DELETE
  USING (auth.user_role() = 'admin');

-- ==============================================================================
-- 4. Bookings
-- Tourists read/create own bookings; Hosts read bookings for their homestays; Admin reads all.
-- ==============================================================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tourists read own bookings"
  ON bookings FOR SELECT
  USING (
    tourist_id = auth.uid()::text
    OR auth.user_role() = 'admin'
    OR homestay_id IN (SELECT homestay_id FROM homestays WHERE host_id = auth.uid()::text)
  );

CREATE POLICY "Tourists create bookings"
  ON bookings FOR INSERT
  WITH CHECK (tourist_id = auth.uid()::text OR auth.user_role() = 'admin');

CREATE POLICY "Host or Admin update booking status"
  ON bookings FOR UPDATE
  USING (
    auth.user_role() = 'admin'
    OR homestay_id IN (SELECT homestay_id FROM homestays WHERE host_id = auth.uid()::text)
    OR tourist_id = auth.uid()::text
  );

-- ==============================================================================
-- 5. Itineraries
-- Private to creator; Admin can read for audit/safety.
-- ==============================================================================
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own itineraries"
  ON itineraries FOR SELECT
  USING (user_id = auth.uid()::text OR auth.user_role() = 'admin');

CREATE POLICY "Users create own itineraries"
  ON itineraries FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR auth.user_role() = 'admin');

CREATE POLICY "Users update own itineraries"
  ON itineraries FOR UPDATE
  USING (user_id = auth.uid()::text OR auth.user_role() = 'admin');

CREATE POLICY "Users delete own itineraries"
  ON itineraries FOR DELETE
  USING (user_id = auth.uid()::text OR auth.user_role() = 'admin');

-- ==============================================================================
-- 6. Live Locations & SOS Emergency Events
-- Sensitive geolocation data: strictly user-owned; SOS visible to DMO/Admin.
-- ==============================================================================
ALTER TABLE live_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own live location"
  ON live_locations FOR ALL
  USING (user_id = auth.uid()::text OR auth.user_role() IN ('admin', 'dmo'))
  WITH CHECK (user_id = auth.uid()::text OR auth.user_role() IN ('admin', 'dmo'));

ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own SOS events, Admins/DMO view all"
  ON sos_events FOR SELECT
  USING (user_id = auth.uid()::text OR auth.user_role() IN ('admin', 'dmo'));

CREATE POLICY "Users create SOS events"
  ON sos_events FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR auth.user_role() IN ('admin', 'dmo'));

CREATE POLICY "Admins update SOS events"
  ON sos_events FOR UPDATE
  USING (auth.user_role() IN ('admin', 'dmo'));

-- ==============================================================================
-- 7. User Preferences, Saved Places & Interactions
-- ==============================================================================
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON user_preferences FOR ALL
  USING (user_id = auth.uid()::text OR auth.user_role() = 'admin')
  WITH CHECK (user_id = auth.uid()::text OR auth.user_role() = 'admin');

ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved places"
  ON saved_places FOR ALL
  USING (user_id = auth.uid()::text OR auth.user_role() = 'admin')
  WITH CHECK (user_id = auth.uid()::text OR auth.user_role() = 'admin');

ALTER TABLE destination_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own interactions"
  ON destination_interactions FOR ALL
  USING (user_id = auth.uid()::text OR auth.user_role() = 'admin')
  WITH CHECK (user_id = auth.uid()::text OR auth.user_role() = 'admin');

-- ==============================================================================
-- 8. Audit Logs
-- Strictly Admin readable and append-only.
-- ==============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit logs"
  ON audit_logs FOR SELECT
  USING (auth.user_role() = 'admin');

CREATE POLICY "Server-side append audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);
