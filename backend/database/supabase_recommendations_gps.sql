-- =========================================================================
-- TravelSathi Supabase Migration: Recommendations & Live GPS Tracking
-- Run this in Supabase SQL Editor to enable real interaction logging & GPS
-- =========================================================================

-- 1. Destination Interactions Table
CREATE TABLE IF NOT EXISTS destination_interactions (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  destination_id INT REFERENCES destinations_master(id) ON DELETE CASCADE,
  interaction_type VARCHAR(32) NOT NULL CHECK (interaction_type IN ('view','search','book','itinerary_include','click','save')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dest_interactions_user ON destination_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_dest_interactions_dest ON destination_interactions(destination_id);
CREATE INDEX IF NOT EXISTS idx_dest_interactions_type ON destination_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_dest_interactions_time ON destination_interactions(created_at);

-- 2. Ephemeral Live Locations Table
CREATE TABLE IF NOT EXISTS live_locations (
  user_id VARCHAR(64) PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_locations_coords ON live_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_live_locations_updated ON live_locations(updated_at);
