import React, { useState } from 'react';
import { MapPin, Star, Calendar, ArrowRight, ShieldCheck, Eye, Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop';

export default function DestinationCard({ 
  destination, 
  onViewDetails, 
  onDirectBook 
}) {
  const [imgSrc, setImgSrc] = useState(destination.image_url || FALLBACK_IMAGE);

  const priceBadgeVariant = {
    budget: 'verified',
    mid: 'pricing',
    luxury: 'alert',
  }[destination.price_range?.toLowerCase()] || 'neutral';

  return (
    <Card variant="default" hover className="flex flex-col h-full overflow-hidden group">
      {/* Thumbnail Container */}
      <div className="h-48 relative overflow-hidden bg-neutral-200">
        <img
          src={imgSrc}
          alt={destination.name}
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
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
        </div>

        {/* Card Footer with Season and Action Buttons */}
        <div className="pt-3 border-t border-neutral-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3 text-neutral-400" />
              <span>Season: <strong className="text-neutral-700">{destination.best_season || 'All Year'}</strong></span>
            </span>
            <span className="text-[10px] text-secondary-800 font-semibold">0% OTA Fee</span>
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
