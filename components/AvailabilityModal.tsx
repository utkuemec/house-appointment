'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Listing } from '@/types';

export default function AvailabilityModal({ 
  listing, 
  onClose 
}: { 
  listing: Listing; 
  onClose: () => void; 
}) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  // We'll manage multiple slots now. Each slot has {start, end}.
  const [slots, setSlots] = useState<{start: string, end: string}[]>([{start: '09:00', end: '17:00'}]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const supabase = createClient();

  // Fetch existing availability when date changes
  useEffect(() => {
    if (!selectedDate) {
      setSlots([{start: '09:00', end: '17:00'}]);
      return;
    }

    async function fetchExisting() {
      setFetching(true);
      const { data } = await supabase
        .from('availability_windows')
        .select('*')
        .eq('listing_id', listing.id)
        .eq('start_date', selectedDate);

      if (data && data.length > 0) {
        // Map existing DB rows to UI slots
        const existingSlots = data.map(row => ({
          start: row.start_time.slice(0, 5),
          end: row.end_time.slice(0, 5)
        }));
        setSlots(existingSlots);
      } else {
        // Default if no data
        setSlots([{start: '09:00', end: '17:00'}]);
      }
      setFetching(false);
    }

    fetchExisting();
  }, [selectedDate, listing.id, supabase]);

  const addSlot = () => {
    setSlots([...slots, {start: '09:00', end: '17:00'}]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: 'start' | 'end', value: string) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  };

  const handleSave = async () => {
    if (!selectedDate) {
      alert('Please select a date.');
      return;
    }
    
    // Validate all slots
    for (const slot of slots) {
      if (slot.start >= slot.end) {
        alert(`Invalid time range: ${slot.start} - ${slot.end}. Start must be before End.`);
        return;
      }
    }

    setLoading(true);

    // 1. First, DELETE existing availability for this SPECIFIC date
    const { error: deleteError } = await supabase
      .from('availability_windows')
      .delete()
      .eq('listing_id', listing.id)
      .eq('start_date', selectedDate);

    if (deleteError) {
      console.error(deleteError);
      alert('Error clearing old availability: ' + deleteError.message);
      setLoading(false);
      return;
    }

    // 2. Insert ALL new slots
    if (slots.length > 0) {
      const dayOfWeek = new Date(selectedDate).getDay() + 1; 
      
      const rowsToInsert = slots.map(slot => ({
        listing_id: listing.id,
        day_of_week: dayOfWeek,
        start_date: selectedDate,
        end_date: selectedDate,
        start_time: slot.start + ':00', 
        end_time: slot.end + ':00',
      }));

      const { error: insertError } = await supabase
        .from('availability_windows')
        .insert(rowsToInsert);

      if (insertError) {
        console.error(insertError);
        alert('Error saving availability: ' + insertError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    alert('Availability updated successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Manage Availability</h3>
            <p className="text-sm text-gray-500 mt-1">{listing.address}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Date</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().split('T')[0]}
            />
            {fetching && <p className="text-xs text-gray-500 mt-1">Checking schedule...</p>}
          </div>

          {/* Dynamic Time Slots */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Time Slots</label>
            
            {slots.map((slot, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateSlot(idx, 'start', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateSlot(idx, 'end', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Remove button (only if more than 1 slot, or allow deleting last one to clear day) */}
                <button 
                  onClick={() => removeSlot(idx)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                  title="Remove slot"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}

            <button
              onClick={addSlot}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-2"
            >
              + Add another time range
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !selectedDate}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
