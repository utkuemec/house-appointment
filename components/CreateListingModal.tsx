'use client';

import { useState, useEffect, useRef } from 'react';
import { createListing } from '@/app/actions';
import { createClient } from '@/utils/supabase/client';

export default function CreateListingModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Autocomplete States
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Debounce Search (Existing Logic)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (addressQuery.length > 2) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&countrycodes=ca&limit=1&addressdetails=1`
          );
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching addresses:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [addressQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelectAddress = (address: any) => {
    setAddressQuery(address.display_name);
    setShowSuggestions(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => {
        const combined = [...prev, ...newFiles];
        return combined.slice(0, 20);
      });
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('listings')
        .upload(fileName, file);

      if (error) {
        console.error('Upload failed:', error);
        continue;
      }
      const { data: publicData } = supabase.storage
        .from('listings')
        .getPublicUrl(fileName);
      if (publicData) urls.push(publicData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const imageUrls = await uploadImages();
      if (imageUrls.length > 0) {
        formData.set('uploadedImages', JSON.stringify(imageUrls));
      } else {
        formData.set('uploadedImages', '[]');
      }

      await createListing(formData);
      onClose();
    } catch (error) {
      alert('Error creating listing: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-gray-900">List Your Property</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Autocomplete Input */}
          <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input 
              name="address"
              type="text"
              required
              placeholder="Start typing address..."
              value={addressQuery}
              onChange={(e) => {
                setAddressQuery(e.target.value);
                if (e.target.value.length <= 2) setShowSuggestions(false);
              }}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                {suggestions.map((item) => {
                  // Split address into main part (Street) and secondary part (City, etc.)
                  const parts = item.display_name.split(', ');
                  const mainText = parts[0];
                  const secondaryText = parts.slice(1, 4).join(', '); // Take next 3 parts like City, Province, Country

                  return (
                    <li 
                      key={item.place_id}
                      onClick={() => handleSelectAddress(item)}
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 border-gray-100 group"
                    >
                      <div className="flex items-center gap-3">
                        {/* Location Icon */}
                        <span className="bg-gray-200 text-gray-500 p-1.5 rounded-full">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 group-hover:text-black">
                            {mainText}
                          </span>
                          <span className="text-xs text-gray-500">
                            {secondaryText}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
                <li className="px-4 py-2 bg-gray-50 text-right">
                  <span className="text-[10px] text-gray-400 italic">Suggestions powered by OpenStreetMap</span>
                </li>
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="listingType" value="rent" defaultChecked className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">For Rent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="listingType" value="sale" className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">For Sale</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input name="price" type="number" required placeholder="2500" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none" />
          </div>

          {/* New Fields Row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beds</label>
              <input name="bedrooms" type="number" min="0" placeholder="2" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Baths</label>
              <input name="bathrooms" type="number" min="0" step="0.5" placeholder="1.5" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sq Ft</label>
              <input name="sqft" type="number" min="0" placeholder="800" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none" />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
            <input 
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1 mb-2">
              {selectedFiles.length > 0 ? `${selectedFiles.length} / 20 files selected` : "Upload up to 20 photos"}
            </p>
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative group w-16 h-16 border rounded overflow-hidden">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(idx)} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" required placeholder="Property details..." rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none resize-none" />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">{loading ? 'Uploading...' : 'Create Listing'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
