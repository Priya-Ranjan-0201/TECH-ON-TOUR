import React, { useState } from 'react';
import { Star, ShieldCheck, Sparkles, MessageSquare, ThumbsUp, CheckCircle2 } from 'lucide-react';

export default function ReviewsView() {
  const [submitted, setSubmitted] = useState(false);
  const [ratingCleanliness, setRatingCleanliness] = useState(5);
  const [ratingHospitality, setRatingHospitality] = useState(5);
  const [ratingAccuracy, setRatingAccuracy] = useState(5);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const sampleReviews = [
    {
      id: 1,
      author: 'Vikramaditya Sengupta',
      stay: 'Pine Shade Kathkuni Homestay',
      date: 'October 2026',
      rating: 4.9,
      aiSummary: 'Praised the authentic wood architecture, zero commercial crowd, and Meena ji’s warm siddu breakfast. Mentioned mountain roads require careful driving after dusk.',
      originalReview: 'The timber craftsmanship here is mind-blowing. Sunil ji and his family made us feel like relatives rather than commercial customers. Clean mountain spring water, cozy fireplace, and immediate river access.'
    },
    {
      id: 2,
      author: 'Priya Nambiar',
      stay: 'Bastar Munda Heritage Tribal Lodge',
      date: 'September 2026',
      rating: 4.8,
      aiSummary: 'Applauded the genuine Gond tribal immersion and direct artisan workshops. Recommended bringing personal toiletries.',
      originalReview: 'Staying here directly supported Budhram ji’s family. The earthen veranda and bell metal workshop were deeply inspiring. True Indian village hospitality.'
    }
  ];

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4 text-brand" />
          <span>Review Intelligence & Trust Layer</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
          Verified Reviews & AI Summarization
        </h1>
        <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
          Verified traveler feedback with multi-category grading (Cleanliness, Hospitality, Accuracy, Value, Safety, Accessibility).
        </p>
      </div>

      {/* Review Submission Card */}
      <div className="ts-card p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
          Write a Verified Review for Your Recent Stay
        </h3>

        {!submitted ? (
          <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="font-bold block mb-1">Cleanliness</label>
                <select
                  value={ratingCleanliness}
                  onChange={(e) => setRatingCleanliness(Number(e.target.value))}
                  className="w-full p-2.5 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-bold"
                >
                  <option value="5">★★★★★ (5/5)</option>
                  <option value="4">★★★★☆ (4/5)</option>
                  <option value="3">★★★☆☆ (3/5)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Hospitality</label>
                <select
                  value={ratingHospitality}
                  onChange={(e) => setRatingHospitality(Number(e.target.value))}
                  className="w-full p-2.5 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-bold"
                >
                  <option value="5">★★★★★ (5/5)</option>
                  <option value="4">★★★★☆ (4/5)</option>
                  <option value="3">★★★☆☆ (3/5)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Accuracy</label>
                <select
                  value={ratingAccuracy}
                  onChange={(e) => setRatingAccuracy(Number(e.target.value))}
                  className="w-full p-2.5 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-bold"
                >
                  <option value="5">★★★★★ (5/5)</option>
                  <option value="4">★★★★☆ (4/5)</option>
                  <option value="3">★★★☆☆ (3/5)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Value for Money</label>
                <select
                  value={ratingValue}
                  onChange={(e) => setRatingValue(Number(e.target.value))}
                  className="w-full p-2.5 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-bold"
                >
                  <option value="5">★★★★★ (5/5)</option>
                  <option value="4">★★★★☆ (4/5)</option>
                  <option value="3">★★★☆☆ (3/5)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1">Your Detailed Feedback</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your authentic experience with host hospitality, regional food, and accessibility..."
                rows={4}
                className="w-full p-3 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-medium outline-none"
                required
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-brand px-6 py-2.5 text-xs font-bold">
                Submit Verified Review
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded bg-nature-light text-nature text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>Thank you! Your verified review has been submitted and ingested by the TravelSathi Trust Engine.</span>
          </div>
        )}
      </div>

      {/* Existing Reviews with AI Summaries */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
          Recent Reviews with AI Intelligence Summaries
        </h3>

        <div className="space-y-4">
          {sampleReviews.map((r) => (
            <div key={r.id} className="ts-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                    {r.stay}
                  </h4>
                  <p className="text-xs text-neutral-muted">Reviewed by {r.author} • {r.date}</p>
                </div>
                <div className="flex text-action font-bold text-xs">
                  ★ {r.rating} / 5.0
                </div>
              </div>

              {/* Section 46: Distinguish AI Summary from Original Review */}
              <div className="p-3.5 rounded bg-ai-bg dark:bg-darkmode-elevated border border-ai-border text-xs space-y-1">
                <span className="font-bold text-ai-text flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand" />
                  <span>AI Synthesis (Distinguished from original review):</span>
                </span>
                <p className="text-ai-text dark:text-darkmode-text-secondary leading-relaxed">
                  "{r.aiSummary}"
                </p>
              </div>

              <div className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed pt-1">
                <strong>Original Review: </strong>"{r.originalReview}"
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
