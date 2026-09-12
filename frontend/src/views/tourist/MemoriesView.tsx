import React, { useState } from 'react';
import { Camera, MapPin, Calendar, Heart, Share2, Sparkles, Plus, Image } from 'lucide-react';

export default function MemoriesView() {
  const [memories, setMemories] = useState([
    {
      id: 1,
      title: 'Solitary Mornings on the Tirthan River',
      destination: 'Gushaini, Himachal Pradesh',
      dates: 'October 15, 2026',
      photos: [
        'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
      ],
      note: 'Woke up at 6:30 AM to crisp 8°C mountain air. The Kathkuni deodar wood balcony smelled of cedar resin. Tara Chand ji showed us how their timber frames have survived earthquakes for 400 years without mortar.'
    },
    {
      id: 2,
      title: 'Dhokra Bronze Sculpting in Bastar',
      destination: 'Kondagaon, Chhattisgarh',
      dates: 'September 24, 2026',
      photos: [
        'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=600&q=80'
      ],
      note: 'Manglu Ram Baghel taught us how to knead natural beeswax into fine threads to sculpt an indigenous deer motif. Fired directly in an earthen pit kiln.'
    }
  ]);

  const [newNote, setNewNote] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const handleAddMemory = (e) => {
    e.preventDefault();
    if (!newNote) return;
    setMemories(prev => [
      {
        id: Date.now(),
        title: 'New Travel Memory',
        destination: 'Tirthan Valley, HP',
        dates: 'Just Now',
        photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'],
        note: newNote
      },
      ...prev
    ]);
    setNewNote('');
    setModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 text-action" />
            <span>Private Personal Travel Vault</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            My Travel Memories
          </h1>
          <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
            A private visual timeline of visited locations, host conversations, and authentic field notes.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-action !text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Travel Memory</span>
        </button>
      </div>

      <div className="space-y-8">
        {memories.map((m) => (
          <div key={m.id} className="ts-card p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-border pb-3">
              <div>
                <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  {m.title}
                </h3>
                <p className="text-xs text-neutral-muted flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-brand" />
                  <span>{m.destination} • {m.dates}</span>
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-neutral-bg text-neutral-muted border border-neutral-border w-fit">
                Private Memory
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {m.photos.map((p, idx) => (
                <img
                  key={idx}
                  src={p}
                  alt="Memory snippet"
                  className="w-full h-56 rounded-ts-md object-cover"
                />
              ))}
            </div>

            <div className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed italic">
              "{m.note}"
            </div>
          </div>
        ))}
      </div>

      {/* Add Memory Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-neutral-card dark:bg-darkmode-surface border border-neutral-border rounded-ts-hero p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
              Add Field Note to Travel Vault
            </h3>

            <form onSubmit={handleAddMemory} className="space-y-3 text-xs">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write your private field reflections about this destination, host conversation, or meal..."
                rows={4}
                className="w-full p-3 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-medium outline-none"
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary py-2 px-3">
                  Cancel
                </button>
                <button type="submit" className="btn-brand py-2 px-4">
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
