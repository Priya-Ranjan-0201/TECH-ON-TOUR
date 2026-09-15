import React, { useState } from 'react';
import { MapPin, Star, Calendar, ArrowRight, ShieldCheck, Eye, Sparkles, Compass } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function DestinationCard({ 
  destination, 
  onViewDetails, 
  onDirectBook 
}) {
  const isPlaceholder = destination.image_source === 'placeholder' || Boolean(destination.needs_manual_photo) || !destination.image_url;
  const [imgError, setImgError] = useState(false);

  const priceBadgeVariant = {
    budget: 'verified',
    mid: 'pricing',
    luxury: 'alert',
  }[destination.price_range?.toLowerCase()] || 'neutral';

  const levelColor = (lvl) => {
    const l = (lvl || '').toLowerCase();
    if (l === 'critical') return 'critical';
    if (l === 'high') return 'high';
    if (l === 'moderate') return 'moderate';
    return 'low';
  };
  const crowdLevel = destination.crowd_level || (destination.crowd_density_score > 80 ? 'critical' : destination.crowd_density_score > 60 ? 'high' : destination.crowd_density_score > 30 ? 'moderate' : 'low');
  const crowdIndex = destination.crowd_index !== undefined && destination.crowd_index !== null ? destination.crowd_index : Math.round((destination.crowd_density_score || 50) * 0.9);

  return (
    <Card variant="default" hover className="flex flex-col h-full overflow-hidden group">
      {/* Thumbnail Container */}
      <div className="h-48 relative overflow-hidden bg-neutral-200">
        {isPlaceholder || imgError ? (
          /* Theme 1 Solid-Color Placeholder (Design.md) - No Mismatched Stock Photos */
          <div className="w-full h-full bg-gradient-to-br from-[#1E5C43] via-[#2A805E] to-[#19523B] flex flex-col items-center justify-center p-4 text-center text-white relative">
            <Compass className="w-7 h-7 text-emerald-200/50 mb-1" />
            <span className="text-xs font-bold font-display text-white/95 line-clamp-1">{destination.name}</span>
            <span className="text-[10px] text-emerald-100/70 font-medium">{destination.state}</span>
            <span className="mt-2 text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-400/30 text-emerald-200 font-mono">
              Theme 1 Grounded
            </span>
          </div>
        ) : (
          <img
            src={destination.image_url}
            alt={destination.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}
        
        {/* Category Pill Over Image */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="bg-primary-900/80 text-ivory text-[11px] font-bold px-2.5 py-0.5 rounded backdrop-blur-sm uppercase tracking-wider">
            {destination.category}
          </span>
          {destination.is_hidden_gem && (
            <span className="bg-secondary-800 text-ivory text-[10px] font-bold px-2 py-0.5 rounded shadow">
              Hidden Gem
            </span>
          )}
        </div>

        {/* Price Tier Badge Over Image */}
        <div className="absolute top-2 right-2">
          <Badge variant={priceBadgeVariant} size="sm" className="backdrop-blur-sm shadow-sm capitalize font-bold">
            {destination.price_range}
          </Badge>
        </div>

        {/* Rating Overlay Bottom Right */}
        <div className="absolute bottom-2 right-2 bg-neutral-900/80 text-ivory text-xs px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1 font-bold">
          <Star className="w-3.5 h-3.5 text-accent-400 fill-accent-400" />
          <span>{destination.rating?.toFixed(1)}</span>
          <span className="text-[10px] text-neutral-400 font-normal">({destination.review_count})</span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* State & District */}
          <div className="flex items-center gap-1 text-xs text-primary-800 font-semibold mb-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{destination.state}</span>
            {destination.distance_km !== undefined && (
              <span className="ml-auto text-[11px] text-secondary-800 font-bold bg-secondary-50 px-1.5 py-0.2 rounded border border-secondary-800/20">
                {destination.distance_km} km
              </span>
            )}
          </div>

          {/* Destination Name */}
          <h3 className="text-base font-display font-bold text-primary-900 line-clamp-1 group-hover:text-primary-800 transition-colors">
            {destination.name}
          </h3>

          {/* Description Snippet */}
          <p className="text-xs text-neutral-600 line-clamp-2 mt-1.5 leading-relaxed">
            {destination.description}
          </p>

          {/* TravelSathi Crowd Index — Verbatim Exact Copy */}
          <div className="mt-2.5 space-y-1">
            <Badge color={levelColor(crowdLevel)} size="sm">
              Crowd Index: {crowdLevel} ({crowdIndex}/100)
            </Badge>
            <p className="text-xs text-neutral-600">
              TravelSathi Crowd Index — derived from platform activity + search trend data, refreshed hourly
            </p>
          </div>
        </div>

        {/* Card Footer with Safety Score and Season */}
        <div className="pt-3 border-t border-neutral-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="flex items-center gap-1 text-[11px] font-bold text-secondary-800 bg-secondary-50 px-2 py-0.5 rounded border border-secondary-800/20">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary-800" />
              <span>{destination.safety_score || 88}/100 Safe</span>
            </span>
            <span className="text-[11px] text-neutral-600 font-medium">
              Season: <strong className="text-neutral-800">{destination.best_season || 'All Year'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(destination)}
              icon={Eye}
              className="text-xs font-semibold"
            >
              Details
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onDirectBook(destination)}
              icon={Sparkles}
              className="text-xs font-bold"
            >
              Direct Book
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
