'use client';

import { useState, useEffect } from 'react';
import IncomingRequestCard from '@/components/IncomingRequestCard';
import EditProfileModal from '@/components/EditProfileModal';
import CreateProfileModal from '@/components/CreateProfileModal';
import RealtorRequestCard from '@/components/RealtorRequestCard';
import { ensureProfile } from '@/app/actions/ensureProfile';
import { useRouter } from 'next/navigation';

interface Profile {
  full_name: string | null;
  phone: string | null;
  city: string | null;
  email?: string;
}

interface ProfileClientProps {
  profile: Profile | null;
  userEmail: string;
  incomingRequests: any[];
  myBookings: any[];
  realtorJobRequests?: any[];
}

export default function ProfileClient({ 
  profile, 
  userEmail, 
  incomingRequests, 
  myBookings,
  realtorJobRequests = []
}: ProfileClientProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  // Auto-heal profile if missing
  useEffect(() => {
    if (!profile) {
      const healProfile = async () => {
        const result = await ensureProfile();
        if (result.success) {
          router.refresh();
        } else {
          setIsCreateModalOpen(true);
        }
      };
      healProfile();
    }
  }, [profile, router]);

  // Filter incoming requests
  const pendingRequests = incomingRequests.filter(r => r.status === 'pending');
  const confirmedRequests = incomingRequests.filter(r => r.status === 'confirmed');

  // Show create profile modal if no profile exists
  if (!profile) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-yellow-800 mb-2">Complete Your Profile</h1>
          <p className="text-yellow-700 mb-6">Please complete your profile to continue.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
          >
            Create Profile
          </button>
        </div>
        {isCreateModalOpen && (
          <CreateProfileModal 
            email={userEmail} 
            onClose={() => setIsCreateModalOpen(false)} 
          />
        )}
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {profile.full_name || userEmail}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.full_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{profile.full_name || 'No Name'}</h2>
                <p className="text-gray-500 text-sm">{userEmail}</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-900">{profile.phone || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">City</span>
                <span className="text-gray-900">{profile.city || 'Not set'}</span>
              </div>
            </div>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="w-full mt-6 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Realtor Dashboard (If user is a Realtor) */}
          {realtorJobRequests.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                Realtor Dashboard (Job Requests)
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  {realtorJobRequests.length}
                </span>
              </h2>
              <div className="space-y-4">
                {realtorJobRequests.map((job: any) => (
                  <RealtorRequestCard key={job.id} job={job} />
                ))}
              </div>
            </section>
          )}

          {/* Pending Requests */}
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

          {/* Confirmed Appointments (Landlord View) */}
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

          {/* My Bookings (Tenant View) */}
          {myBookings.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">My Bookings (Visiting)</h2>
              <div className="space-y-4">
                {myBookings.map((booking: any) => (
                  <div key={booking.id} className="bg-white p-5 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{booking.listings?.address}</h3>
                      <p className="text-gray-600">
                        {new Date(booking.start_time).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} at {new Date(booking.start_time).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
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
            </section>
          )}

          {/* Empty State */}
          {pendingRequests.length === 0 && confirmedRequests.length === 0 && myBookings.length === 0 && realtorJobRequests.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-lg">No activity yet. Start by browsing listings or creating one!</p>
            </div>
          )}

        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal 
          profile={profile} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}
    </main>
  );
}
