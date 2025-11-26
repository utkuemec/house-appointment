import { AvailabilityWindow, Appointment, TimeSlot } from '../types';

export function generateTimeSlots(
  window: AvailabilityWindow,
  bookedAppointments: Appointment[],
  targetDate: Date
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Parse window start/end times (HH:MM:SS)
  const [startHour, startMinute] = window.start_time.split(':').map(Number);
  const [endHour, endMinute] = window.end_time.split(':').map(Number);

  // Create Date objects for the window on the targetDate
  const windowStart = new Date(targetDate);
  windowStart.setHours(startHour, startMinute, 0, 0);

  const windowEnd = new Date(targetDate);
  windowEnd.setHours(endHour, endMinute, 0, 0);

  // Iterate in 60-minute increments
  let currentSlotStart = new Date(windowStart);
  
  while (currentSlotStart < windowEnd) {
    const currentSlotEnd = new Date(currentSlotStart.getTime() + 60 * 60000); // +60 mins

    if (currentSlotEnd > windowEnd) break;

    // Check if this slot is booked
    const isBooked = bookedAppointments.some(appt => {
      const apptStart = new Date(appt.start_time);
      const apptEnd = new Date(appt.end_time);
      
      // Check for overlap or exact match
      // Simple logic: if the slot start is within an appointment
      return (
        (currentSlotStart >= apptStart && currentSlotStart < apptEnd) ||
        (currentSlotStart < apptStart && currentSlotEnd > apptStart)
      );
    });

    slots.push({
      start: new Date(currentSlotStart),
      end: new Date(currentSlotEnd),
      available: !isBooked
    });

    // Move to next slot
    currentSlotStart = currentSlotEnd;
  }

  return slots;
}

