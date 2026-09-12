export interface Destination {
  id: number;
  name: string;
  state: string;
  category: 'hotel' | 'attraction' | 'homestay' | 'restaurant' | string;
  latitude: number;
  longitude: number;
  price_range?: 'budget' | 'mid' | 'luxury' | string;
  rating: number;
  review_count: number;
  description: string;
  best_season?: string;
  image_url: string;
  safety_score?: number;
  is_hidden_gem?: boolean;
  city?: string;
  entry_fee_inr?: number;
  tags?: string[];
  crowd_level?: string;
}

export interface ItineraryStop {
  time?: string;
  time_slot?: string;
  name?: string;
  title?: string;
  note?: string;
  description?: string;
  destination_id?: number;
  destination_name?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  estimated_duration?: string;
  estimated_cost_inr?: number;
  insider_tip?: string;
  image_url?: string;
  transit_from_previous_km?: number;
  transit_time_minutes?: number;
  transit_guard_fare_inr?: number;
  transit_mode?: string;
  crowd_level?: string;
  best_time_to_visit?: string;
  flagged?: boolean;
}

export interface ItineraryDay {
  day?: number;
  day_number?: number;
  theme?: string;
  weather_advisory?: string;
  stops?: ItineraryStop[];
  morning_activity?: any;
  afternoon_activity?: any;
  evening_activity?: any;
  day_cost_inr?: number;
  culinary_highlight?: string;
  recommended_homestay?: any;
}

export interface BudgetBreakdown {
  accommodation_inr: number;
  activities_inr: number;
  food_inr?: number;
  meals_inr?: number;
  transit_inr?: number;
  transport_inr?: number;
  total_inr: number;
  ota_commission_saved_inr?: number;
}

export interface EcoFootprint {
  carbon_kg?: number;
  commercial_tour_carbon_kg?: number;
  carbon_saved_pct?: number;
  sustainability_score?: number;
  eco_tokens_awarded?: number;
}

export interface Itinerary {
  id: string | number;
  title?: string;
  user_id?: string;
  destination?: string;
  state?: string;
  days: number;
  budget?: string;
  interests?: string[];
  summary?: string;
  plan_json?: any;
  days_schedule?: ItineraryDay[];
  schedule?: any[];
  budget_breakdown?: BudgetBreakdown;
  eco_footprint?: EcoFootprint;
  generation_source?: string;
  created_at?: string;
  eco_permit_rerouted?: boolean;
  original_destination?: string;
  diversion_advisory?: string;
}

export interface Booking {
  id: number | string;
  user_id: string;
  listing_id?: number | string;
  homestay_id?: string;
  check_in: string;
  check_out: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_id?: string;
  payment_status?: string;
  amount: number;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
}

export interface Homestay {
  id: string;
  name: string;
  state: string;
  city?: string;
  price_per_night: number;
  is_tribal_pm_juga: boolean;
  host_name: string;
  host_phone?: string;
  rating: number;
  description: string;
  amenities?: string[];
  image_url: string;
}

export interface Review {
  id: number | string;
  destination_id: number;
  user_id: string;
  rating: number;
  text: string;
  authenticity_score?: number;
  is_verified?: boolean;
  created_at?: string;
}
