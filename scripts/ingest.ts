import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function mapRealtorData(externalListing: any) {
  // Log specific structure to debug mapping
  // console.log('DEBUG PROP:', JSON.stringify(externalListing, null, 2));

  // Access fields based on standard Realtor.ca structure (often PascalCase)
  // Address is often in Property.Address.AddressText
  const prop = externalListing.Property || {};
  const addressObj = prop.Address || {};
  
  const address = addressObj.AddressText || externalListing.Address?.AddressText || 'Address Unknown';
  
  // Price
  let price = 0;
  const priceStr = prop.Price || externalListing.Price || '0';
  price = parseInt(priceStr.replace(/\D/g, '')) || 0;

  // Description
  const description = externalListing.PublicRemarks || prop.PublicRemarks || 'No description available.';
  
  // Photos
  const photoObj = prop.Photo || externalListing.Photo || [];
  const photos = Array.isArray(photoObj) ? photoObj.map((p: any) => p.HighResPath) : [];

  // URL
  const relativeUrl = externalListing.RelativeDetailsURL || prop.RelativeDetailsURL;
  const sourceUrl = relativeUrl 
    ? `https://www.realtor.ca${relativeUrl}` 
    : `https://realtor.ca/listing/${externalListing.Id || Math.random()}`;

  // Map TransactionTypeId to listing_type
  // RapidAPI: 2 = Sale, 3 = Rent
  const transactionTypeId = parseInt(externalListing.TransactionTypeId || prop.TransactionTypeId) || 2; 
  const listing_type = transactionTypeId === 3 ? 'rent' : 'sale';

  return {
    address,
    price,
    description,
    images_json: photos,
    source_url: sourceUrl,
    contact_email: 'agent@example.com',
    listing_type
  };
}

async function syncRealtorData() {
  console.log('📡 Starting Data Sync...');

  if (!RAPIDAPI_KEY) {
    console.error('❌ Error: Missing RAPIDAPI_KEY');
    return;
  }

  try {
    const query = new URLSearchParams({
        'LatitudeMax': '43.8554',
        'LatitudeMin': '43.5810',
        'LongitudeMax': '-79.1169',
        'LongitudeMin': '-79.6393', 
        'CurrentPage': '1',
        'RecordsPerPage': '5', // Fetch just 5 to test mapping
        'SortOrder': 'A',
        'SortBy': '1', 
        'CultureId': '1',
        'NumberOfDays': '0',
        'BedRange': '0-0',
        'BathRange': '0-0',
        'RentMin': '0'
    });

    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'realty-in-ca1.p.rapidapi.com'
      }
    };

    const response = await fetch(`https://realty-in-ca1.p.rapidapi.com/properties/list-residential?${query}`, options);
    const data = await response.json();
    
    // 1. Log the raw structure of the FIRST result to see exactly where the data is
    if (data.Results && data.Results.length > 0) {
        console.log('🔍 RAW STRUCTURE EXAMPLE:', JSON.stringify(data.Results[0], null, 2));
    }

    const properties = data.Results || [];
    console.log(`📥 Fetched ${properties.length} properties.`);

    for (const prop of properties) {
      const listing = mapRealtorData(prop);

      // Skip invalid listings
      if (listing.address === 'Address Unknown') {
          console.warn('⚠️ Skipping listing with unknown address (check mapping)');
          continue;
      }

      const { error } = await supabase
        .from('listings')
        .upsert(listing, { onConflict: 'source_url' });

      if (error) {
        console.error(`❌ Failed to save ${listing.address}:`, error.message);
      } else {
        console.log(`✅ Saved: ${listing.address}`);
      }
    }

  } catch (error) {
    console.error('Sync failed:', error);
  }
}

syncRealtorData();
