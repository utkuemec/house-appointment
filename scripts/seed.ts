import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DUMMY_LISTINGS = [
  {
    address: '123 Bloor St W, Toronto, ON',
    price: 2500,
    description: 'Modern 1BR condo in the heart of Yorkville. Close to subway.',
    images_json: ['https://placehold.co/600x400?text=Condo+1'],
    source_url: 'https://realtor.ca/listing/123',
    contact_email: 'MY_TEST_EMAIL_PLACEHOLDER', // The magical key for testing
  },
  {
    address: '456 Queen St W, Toronto, ON',
    price: 3200,
    description: 'Spacious 2BR loft with exposed brick.',
    images_json: ['https://placehold.co/600x400?text=Loft+2'],
    source_url: 'https://housesigma.com/listing/456',
    contact_email: 'landlord1@example.com',
  },
  {
    address: '789 Yonge St, Toronto, ON',
    price: 1900,
    description: 'Cozy studio, perfect for students.',
    images_json: ['https://placehold.co/600x400?text=Studio+3'],
    source_url: 'https://realtor.ca/listing/789',
    contact_email: 'landlord2@example.com',
  },
  {
    address: '101 King St E, Toronto, ON',
    price: 4500,
    description: 'Luxury penthouse with lake views.',
    images_json: ['https://placehold.co/600x400?text=Penthouse+4'],
    source_url: 'https://realtor.ca/listing/101',
    contact_email: 'landlord3@example.com',
  },
  {
    address: '202 Dundas St W, Toronto, ON',
    price: 2800,
    description: 'Recently renovated 1BR plus den.',
    images_json: ['https://placehold.co/600x400?text=Renovated+5'],
    source_url: 'https://housesigma.com/listing/202',
    contact_email: 'landlord4@example.com',
  },
];

async function seed() {
  console.log('🌱 Seeding listings...');

  const { error } = await supabase
    .from('listings')
    .insert(DUMMY_LISTINGS);

  if (error) {
    console.error('Error inserting listings:', error);
  } else {
    console.log('✅ Successfully inserted 5 dummy listings.');
  }
}

seed();

