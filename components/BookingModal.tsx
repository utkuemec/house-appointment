'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Listing, AvailabilityWindow, Appointment, TimeSlot } from '@/types';
import { generateTimeSlots } from '@/lib/availability';
import { createAppointment } from '@/app/actions';

export default function BookingModal({ 
  listing, 
  onClose 
}: { 
  listing: Listing; 
  onClose: () => void; 
}) {
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Instead of a string, we store the selected Date object directly
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: windowData } = await supabase
        .from('availability_windows')
        .select('*')
        .eq('listing_id', listing.id);
      
      const { data: apptData } = await supabase
        .from('appointments')
        .select('*')
        .eq('listing_id', listing.id);

      if (windowData) {
        setWindows(windowData);
        
        // Generate next 30 available dates
        const dates: Date[] = [];
        const today = new Date();
        today.setHours(0,0,0,0);

        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dayOfWeek = d.getDay(); // Legacy fallback
          
          // Check if any window matches this specific date OR recurring day
          const dateString = d.toISOString().split('T')[0];
          const hasWindow = windowData.some(w => {
            // Specific date match
            if (w.start_date && w.start_date === dateString) return true;
            
            // Legacy Recurring match (only if no start_date is set)
            // However, we want to prefer specific dates if possible.
            // If we only want strict specific dates now, we just check start_date.
            // The user said "not all mondays", so let's prioritize specific dates.
            if (!w.start_date && w.day_of_week === dayOfWeek) return true;
            
            return false;
          });

          if (hasWindow) {
            dates.push(d);
          }
        }
        setAvailableDates(dates);
      }
      
      if (apptData) setAppointments(apptData);
      setLoading(false);
    }
    fetchData();
  }, [listing.id, supabase]);

  const handleBook = async (startTime: Date, endTime: Date) => {
    setBookingStatus('loading');
    
    try {
      // Use Server Action to create appointment AND send email
      await createAppointment(
        listing.id, 
        startTime.toISOString(), 
        endTime.toISOString()
      );
      
      setBookingStatus('success');
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error(error);
      alert('Error booking: ' + error);
      setBookingStatus('error');
    }
  };

  // Generate and Deduplicate slots if a date is selected
  let uniqueSlots: TimeSlot[] = [];
  if (selectedDate) {
    const dayOfWeek = selectedDate.getDay();
    const dateString = selectedDate.toISOString().split('T')[0];

    // Filter windows relevant to this specific date
    const dailyWindows = windows.filter(w => {
      if (w.start_date === dateString) return true;
      if (!w.start_date && w.day_of_week === dayOfWeek) return true;
      return false;
    });
    
    // Generate all raw slots (potentially overlapping)
    const rawSlots = dailyWindows.flatMap(window => 
      generateTimeSlots(window, appointments, selectedDate)
    );

    // Deduplicate based on start time string
    const seenTimes = new Set();
    uniqueSlots = rawSlots.filter(slot => {
      const timeKey = slot.start.toISOString();
      if (seenTimes.has(timeKey)) return false;
      seenTimes.add(timeKey);
      return true;
    });

    // Sort by time
    uniqueSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Book Viewing</h3>
            <p className="text-sm text-gray-500">{listing.address}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading availability...</div>
        ) : bookingStatus === 'success' ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center mb-4">
            ✅ Appointment request sent!
          </div>
        ) : (
          <div>
            {/* Date Selection - Grid of Buttons */}
            {!selectedDate ? (
              <>
                <h4 className="font-medium text-gray-700 mb-3">Select a Date</h4>
                {availableDates.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
                    No availability found for the next 30 days.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {availableDates.map((date) => (
                      <button
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <span className="text-xs text-gray-500 uppercase font-semibold">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {date.getDate()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Time Slot Selection */
              <>
                <div className="flex items-center gap-2 mb-4">
                  <button 
                    onClick={() => setSelectedDate(null)}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    ← Back to dates
                  </button>
                  <span className="text-gray-300">|</span>
                  <span className="font-semibold text-gray-900">
                    {/* Display EXACT date properly adjusted for timezone offset */}
                    {new Date(selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {uniqueSlots.map((slot, i) => (
                    <button
                      key={i}
                      disabled={!slot.available || bookingStatus === 'loading'}
                      onClick={() => handleBook(slot.start, slot.end)}
                      className={`
                        py-2 px-3 rounded-lg text-sm font-medium transition-colors
                        ${slot.available 
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                      `}
                    >
                      {slot.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {slot.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </button>
                  ))}
                  {uniqueSlots.length === 0 && (
                    <p className="col-span-2 text-center text-gray-500 py-4">No slots available.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
