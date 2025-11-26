import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import IncomingRequestCard from '@/components/IncomingRequestCard';

export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch Profile Data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 1. Fetch "My Bookings" (I am the Tenant)
  const { data: myBookings } = await supabase
    .from('appointments')
    .select('*, listings(address, contact_email)')
    .eq('tenant_user_id', user.id)
    .order('start_time', { ascending: true });

  // 2. Fetch "Incoming Requests" (I am the Landlord)
  const { data: myListings } = await supabase
    .from('listings')
    .select('id')
    .eq('contact_email', user.email || '');

  let allIncoming: any[] = [];
  if (myListings && myListings.length > 0) {
    const listingIds = myListings.map(l => l.id);
    const { data: requests } = await supabase
      .from('appointments')
      .select('*, listings(address), profiles(email, full_name, phone)')
      .in('listing_id', listingIds)
      .order('start_time', { ascending: true });
    
    allIncoming = requests || [];
  }

  // Filter Incoming Requests
  const pendingRequests = allIncoming.filter(r => r.status === 'pending');
  const confirmedRequests = allIncoming.filter(r => r.status === 'confirmed');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info Card */}
        <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
              {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile?.full_name || 'User'}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Phone</label>
              <p className="text-gray-900">{profile?.phone || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">City</label>
              <p className="text-gray-900">{profile?.city || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Appointments */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* SECTION 1: PENDING REQUESTS */}
          {pendingRequests.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Incoming Requests
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              </h2>
              <div className="space-y-4">
                {pendingRequests.map((req: any) => (
                  <IncomingRequestCard key={req.id} request={req} />
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: SCHEDULED APPOINTMENTS (Landlord View) */}
          {confirmedRequests.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Upcoming Viewings (My Properties)
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {confirmedRequests.length}
                </span>
              </h2>
              <div className="space-y-4">
                {confirmedRequests.map((req: any) => (
                  <IncomingRequestCard key={req.id} request={req} />
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3: MY BOOKINGS (Tenant View) */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Bookings (Visiting)</h2>
            {!myBookings || myBookings.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-xl border text-center text-gray-500">
                You haven't booked any viewings yet.
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.map((booking: any) => (
                  <div key={booking.id} className="bg-white p-5 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{booking.listings?.address}</h3>
                      <p className="text-gray-600">
                        {new Date(booking.start_time).toLocaleDateString()} at {new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                        ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }
                      `}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}
