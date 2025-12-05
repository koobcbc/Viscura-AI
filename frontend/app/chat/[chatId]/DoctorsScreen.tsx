import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Linking, Alert, TextInput, Button, Modal, Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import taxonomy from '../../../assets/nucc_taxonomy_250.json';
import cachedDoctors60611Dermatology from '../../../assets/doctors_cache_60611_dermatology.json';
import cachedDoctors60611Dentist from '../../../assets/doctors_cache_60611_dentist.json';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Constants from 'expo-constants';
import DropDownPicker from 'react-native-dropdown-picker';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig'; // adjust path as needed


// Helper function to get state from zipcode
const getStateFromZipcode = async (zipcode: string): Promise<string> => {
  try {
    const geoResults = await Location.geocodeAsync(zipcode);
    if (geoResults.length > 0) {
      const reverse = await Location.reverseGeocodeAsync({
        latitude: geoResults[0].latitude,
        longitude: geoResults[0].longitude
      });
      if (reverse[0]?.region) {
        return reverse[0].region; // region is the state abbreviation (e.g., "IL")
      }
    }
  } catch (error) {
    console.warn(`Failed to get state from zipcode ${zipcode}:`, error);
  }
  // Fallback to IL if we can't determine state
  return 'IL';
};

// Enable fast loading for demo (uses cached data for 60611 zip code and Dermatology)
const ENABLE_FAST_LOADING = true;

// Enable saving filtered results to file (for sharing actual API results)
const ENABLE_SAVE_RESULTS = false;

type Doctor = {
  name: string;
  specialty: string;
  address: string;
  mapQuery: string;
  latitude?: number;
  longitude?: number;
  distance?: number; // Distance in miles from user location
};
type TaxonomyEntry = {
  Grouping: string;
  Classification: string;
  Specialization: string;
  "Display Name": string;
  Code: string;
};

type SpecializationEntry = {
  name: string;
  displayName: string;
  code: string;
  specialization: string;
};

type NestedSpecialties = {
  [group: string]: {
    [classification: string]: SpecializationEntry[];
  };
};

type Summary = {
  diagnosis: string;
  symptoms: string[];
  causes: string[];
  treatments: string[];
  specialty: string;
};

export default function DoctorsScreen({ summary, chatCategory }: { summary: Summary; chatCategory?: 'skin' | 'oral' | null }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [zipCode, setZipCode] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [zipInput, setZipInput] = useState('');
  const [mapRegion, setMapRegion] = useState({
    latitude: 41.8781, // Chicago default
    longitude: -87.6298,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [showMap, setShowMap] = useState(false); // Default to list mode
  const [selectedSpecialty, setSelectedSpecialty] = useState(() => {
    // If summary has a specialty, use it; otherwise use chat category default
    if (summary.specialty) {
      if (summary.specialty.toLowerCase().includes('oral')) {
        return "Dentist";
      } else {
        return summary.specialty;
      }
    }
    
    // Set default based on chat category
    if (chatCategory === 'skin') {
      return 'Dermatology';
    } else if (chatCategory === 'oral') {
      return 'Dentist';
    }
    
    return '';
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [hasChangedDefaults, setHasChangedDefaults] = useState(false);


  // Dropdown states
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupValue, setGroupValue] = useState<string | null>(null);
  const [groupItems, setGroupItems] = useState<{label: string; value: string}[]>([]);

  const [classOpen, setClassOpen] = useState(false);
  const [classValue, setClassValue] = useState<string | null>(null);
  const [classItems, setClassItems] = useState<{label: string; value: string}[]>([]);

  const [specOpen, setSpecOpen] = useState(false);
  const [specValue, setSpecValue] = useState<string | null>(null);
  const [specItems, setSpecItems] = useState<{label: string; value: string}[]>([]);

  const [nestedSpecialties, setNestedSpecialties] = useState<NestedSpecialties>({});

  // zip code
  const [editingZip, setEditingZip] = useState(false);

  useEffect(() => {
    const tree = buildNestedSpecialties(taxonomy);
    setNestedSpecialties(tree);
    setGroupItems(Object.keys(tree).map(k => ({ label: k, value: k })));

    // If chatCategory is oral, automatically set to Dental Providers > Dentist > Dentist
    if (chatCategory === 'oral') {
      // Find the general Dentist entry (where Specialization is empty)
      const dentalDentist = taxonomy.find(
        (entry) =>
          entry["Grouping"] === "Dental Providers" &&
          entry["Classification"] === "Dentist" &&
          (entry["Specialization"] === "" || !entry["Specialization"])
      );
      
      if (dentalDentist) {
        setGroupValue("Dental Providers");
        setClassValue("Dentist");
        // Use "Dentist" as specValue even though Specialization is empty in taxonomy
        setSpecValue("Dentist");
        setSelectedSpecialty("Dentist");
        return;
      }
    }

    // Determine which specialty to use for matching
    const specialtyToMatch = summary.specialty || selectedSpecialty;
    
    const matched =
      taxonomy.find(
        (entry) =>
          entry["Specialization"] &&
          entry["Specialization"].toLowerCase() === specialtyToMatch.toLowerCase()
      ) ||
      taxonomy.find(
        (entry) =>
          entry["Classification"] &&
          entry["Specialization"] === "" &&
          entry["Classification"].toLowerCase() === specialtyToMatch.toLowerCase()
      );
      
    if (matched) {
      setGroupValue(matched.Grouping);
      setClassValue(matched.Classification);
      setSpecValue(matched.Specialization || matched.Classification); // This is used as dropdown label
      setSelectedSpecialty(matched.Specialization || matched.Classification); // Used for search
    }
  }, [summary.specialty, chatCategory]);

  useEffect(() => {
    const fetchZipFromUser = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userRef);
  
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.zipCode) {
              const zip = data.zipCode;
              setZipCode(zip);
              setZipInput(zip);

              const geoResults = await Location.geocodeAsync(zip);
              if (geoResults.length > 0) {
                const { latitude, longitude } = geoResults[0];
                // Set location for distance calculations
                setLocation({
                  coords: { latitude, longitude, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null },
                  timestamp: Date.now()
                } as Location.LocationObject);
                
                const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
                const place = reverse[0];
                if (place?.city || place?.subregion || place?.region) {
                  setCity(place.city || place.subregion || place.region || '');
              }

                fetchDoctors(latitude, longitude, zip, selectedSpecialty);
              } else {
              fetchDoctors(undefined, undefined, zip, selectedSpecialty);
              }
              return; // skip location request
            }
          }
        }
  
        // If no zipCode in Firestore or user not logged in
        requestLocation();
      } catch (err) {
        console.error("Failed to load user ZIP from Firestore:", err);
        Alert.alert("Firestore Error", "Unable to fetch saved ZIP code.");
        requestLocation();
      }
    };
  
    fetchZipFromUser();
  }, []);

  function buildNestedSpecialties(taxonomy: TaxonomyEntry[]): NestedSpecialties {
    const nested: NestedSpecialties = {};
  
    taxonomy.forEach(({ Grouping, Classification, Specialization, "Display Name": DisplayName, Code }) => {
      if (!Grouping || !Classification) return;
  
      if (!nested[Grouping]) nested[Grouping] = {};
      if (!nested[Grouping][Classification]) nested[Grouping][Classification] = [];
  
      nested[Grouping][Classification].push({
        name: Specialization || Classification,
        displayName: DisplayName,
        code: Code,
        specialization: Specialization,
      });
    });
  
    return nested;
  }

  useEffect(() => {
    if (groupValue) {
      const classes = Object.keys(nestedSpecialties[groupValue] || {});
      setClassItems(classes.map(c => ({ label: c, value: c })));
      if (hasChangedDefaults) {
        setClassValue(null);
        setSpecValue(null);
        setSpecItems([]);
      }
    }
  }, [groupValue]);

  function setGroupValueInDropdown(callback: any) {
    const value = typeof callback === 'function' ? callback(groupValue) : callback;
    setGroupValue(value);
    setHasChangedDefaults(true);
  }

  useEffect(() => {
    if (groupValue && classValue) {
      const specs = nestedSpecialties[groupValue][classValue];
      setSpecItems(
        specs.map((s: SpecializationEntry) => ({
          label: s.name,
          value: s.name, // ensures uniqueness
        }))
      );
    }
  }, [classValue]);

  useEffect(() => {
    if (specValue && !loading) {
      // Pass location coordinates if available
      const userLat = location?.coords.latitude;
      const userLon = location?.coords.longitude;
      fetchDoctors(userLat, userLon, zipCode, specValue);
    }
  }, [specValue]);

  const requestLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      console.log("loc", loc)

      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      
      
      if (geo[0]) {
        const { postalCode, city, subregion, region } = geo[0];
        if (postalCode) {
          setZipInput(postalCode)
          setZipCode(postalCode)
          try {
            const user = auth.currentUser;
            if (user) {
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, { zipCode: postalCode });
              console.log("Zip code saved to Firestore");
            }
          } catch (err) {
            console.error("Failed to update Firestore:", err);
            Alert.alert("Firestore Error", "Failed to save ZIP code.");
          }
        };
        if (city || subregion || region) {
          setCity(city || subregion || region || ''); // fallback if city is undefined
        }
      }

      fetchDoctors(loc.coords.latitude, loc.coords.longitude, undefined, selectedSpecialty);
    } catch (err: any) {
      setError("Unable to fetch location.");
      setLoading(false);
    }
  };

  const formatZipCode = (address: string) => {
    return address.replace(/(\D|^)(\d{5})(\d{4})(\D|$)/, '$1$2-$3$4');
  };

  // Save filtered results to file and console for sharing
  const saveFilteredResults = async (doctors: Doctor[], zipCode: string, specialty: string) => {
    try {
      const resultsData = {
        zipCode,
        specialty,
        timestamp: new Date().toISOString(),
        count: doctors.length,
        doctors: doctors
      };

      // Log to console in a copyable format
      console.log('\n📋 ===== FILTERED RESULTS (Copy this JSON) =====');
      console.log(JSON.stringify(resultsData, null, 2));
      console.log('📋 ===== END OF RESULTS =====\n');

      // Save to file
      const fileName = `doctors_cache_${zipCode}_${specialty.toLowerCase().replace(/\s+/g, '_')}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(resultsData.doctors, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      console.log(`💾 Results saved to: ${fileUri}`);
      console.log(`📁 File name: ${fileName}`);
      
      // Also show in alert for easy access
      Alert.alert(
        'Results Saved',
        `Filtered results saved!\n\nFile: ${fileName}\nLocation: ${fileUri}\n\nCheck console for JSON to copy.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving results:', error);
    }
  };

  // Calculate distance between two coordinates using Haversine formula (returns miles)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchDoctors = async (lat?: number, lon?: number, zip?: string, specialty?: string) => {
    setLoading(true);
    try {
      let selected = specialty || selectedSpecialty;
      let userCity = city;
      let userLat = lat;
      let userLon = lon;

      // Fast loading: Use cached data for demo (only for zipcode 60611)
      // If zipcode changes to something else, it will fall through to normal API fetching
      // If specialty changes, it will use the appropriate cache (dentist vs dermatology)
      if (ENABLE_FAST_LOADING && zip === '60611') {
        console.log(`🚀 Using cached data for fast loading (zip: ${zip}, specialty: ${selected || 'default'})`);
        
        // Set city for 60611
        if (!userCity) {
          setCity('Chicago');
          userCity = 'Chicago';
        }
        
        // Get user location for distance calculation
        // Use provided coordinates if available, otherwise geocode the zipcode
        if (!userLat || !userLon) {
          if (zip === '60611') {
            // Approximate coordinates for 60611 (Chicago)
            const geoResults = await Location.geocodeAsync('60611');
            if (geoResults.length > 0) {
              userLat = geoResults[0].latitude;
              userLon = geoResults[0].longitude;
              setLocation({
                coords: { latitude: userLat, longitude: userLon, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null },
                timestamp: Date.now()
              } as Location.LocationObject);
            }
          }
        }

        // Use cached data and recalculate distances if user location is available
        // Use dentist cache if specialty is oral/Dental, otherwise use dermatology cache
        // This handles specialty changes correctly
        const isOralSpecialty = selected?.toLowerCase().includes('dental') || 
                                selected?.toLowerCase().includes('oral') ||
                                chatCategory === 'oral';
        const cachedDoctorsSource = isOralSpecialty ? cachedDoctors60611Dentist : cachedDoctors60611Dermatology;
        
        console.log(`📋 Using ${isOralSpecialty ? 'dentist' : 'dermatology'} cache for specialty: ${selected || 'default'}`);
        
        const cachedDoctors = (cachedDoctorsSource as Doctor[]).map(doctor => {
          let distance = doctor.distance;
          if (userLat && userLon && doctor.latitude && doctor.longitude) {
            distance = calculateDistance(userLat, userLon, doctor.latitude, doctor.longitude);
          }
          return { ...doctor, distance };
        });

        // Sort by distance and limit to top 20
        const sortedDoctors = cachedDoctors
          .sort((a, b) => {
            const distA = a.distance ?? Infinity;
            const distB = b.distance ?? Infinity;
            return distA - distB;
          })
          .slice(0, 20);

        setDoctors(sortedDoctors);
        
        // Save cached results (optional - for comparison)
        if (ENABLE_SAVE_RESULTS && sortedDoctors.length > 0) {
          saveFilteredResults(sortedDoctors, zip || '60611', selected);
        }
        
        // Update map region
        if (sortedDoctors.length > 0) {
          const avgLat = sortedDoctors.reduce((sum, d) => sum + (d.latitude || 0), 0) / sortedDoctors.length;
          const avgLon = sortedDoctors.reduce((sum, d) => sum + (d.longitude || 0), 0) / sortedDoctors.length;
          setMapRegion({
            latitude: userLat || avgLat,
            longitude: userLon || avgLon,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
        
        setLoading(false);
        return;
      }
      
      // If zipcode is not '60611' or fast loading is disabled, proceed with normal API fetching
      if (ENABLE_FAST_LOADING && zip && zip !== '60611') {
        console.log(`📍 Zipcode changed to ${zip}, fetching from API (fast loading only works for 60611)`);
      }

      // If we have location but no city, get city from reverse geocoding
      if ((lat && lon) && !userCity) {
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (geo[0]?.city) {
          userCity = geo[0].city;
          setCity(userCity);
        }
      }

      // Get state from zipcode (or use location if available)
      let state = 'IL'; // Default fallback
      if (zip) {
        state = await getStateFromZipcode(zip);
        console.log(`📍 Determined state "${state}" from zipcode ${zip}`);
      } else if (userLat && userLon) {
        // If we have coordinates but no zip, get state from coordinates
        try {
          const reverse = await Location.reverseGeocodeAsync({ latitude: userLat, longitude: userLon });
          if (reverse[0]?.region) {
            state = reverse[0].region;
            console.log(`📍 Determined state "${state}" from coordinates`);
          }
        } catch (error) {
          console.warn('Failed to get state from coordinates:', error);
        }
      }

      // If we have zip but need city, get it from reverse geocoding
      if (zip && !userCity) {
        const geoResults = await Location.geocodeAsync(zip);
        if (geoResults.length > 0) {
          const reverse = await Location.reverseGeocodeAsync({ 
            latitude: geoResults[0].latitude, 
            longitude: geoResults[0].longitude 
          });
          if (reverse[0]?.city) {
            userCity = reverse[0].city;
            setCity(userCity);
            userLat = geoResults[0].latitude;
            userLon = geoResults[0].longitude;
          }
        }
      }

      // Build base URL - NPI Registry API may not support city parameter directly
      // So we'll search by state and filter by city in results
      // Reduced limit to avoid 500 errors
      const buildUrl = (taxonomy: string, proxyIndex = 0) => {
        const baseUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&taxonomy_description=${encodeURIComponent(taxonomy)}&limit=50&state=${state}`;
        
        // Try different CORS proxies if one fails
        const proxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`,
          `https://corsproxy.io/?${encodeURIComponent(baseUrl)}`,
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(baseUrl)}`,
          baseUrl // Direct call as last resort
        ];
        
        return proxies[proxyIndex] || proxies[0];
      };

      // Helper function to fetch with retry logic and timeout
      const fetchWithRetry = async (taxonomy: string, taxonomyName: string, retries = 3) => {
        for (let attempt = 0; attempt < retries; attempt++) {
          // Try different proxy on each retry
          const url = buildUrl(taxonomy, attempt);
          
          try {
            // Add delay between retries
            if (attempt > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }

            // Create a timeout promise (15 seconds)
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Request timeout')), 15000);
            });

            // Race between fetch and timeout
            const response = await Promise.race([
              fetch(url, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                },
              }),
              timeoutPromise
            ]) as Response;
            
            // Check if response is ok
            if (!response.ok) {
              const errorText = await response.text().catch(() => '');
              console.warn(`API error for ${taxonomyName} (attempt ${attempt + 1}): ${response.status} ${response.statusText}`, errorText.substring(0, 100));
              
              // If 500 or 408 error and not last attempt, retry with different proxy
              if ((response.status === 500 || response.status === 408) && attempt < retries - 1) {
                console.log(`Retrying ${taxonomyName} with different proxy...`);
                continue;
              }
              return { results: [] };
            }

            // Check content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const text = await response.text();
              console.warn(`Non-JSON response for ${taxonomyName} (attempt ${attempt + 1}):`, text.substring(0, 200));
              
              if (attempt < retries - 1) {
                continue;
              }
              return { results: [] };
            }

            const json = await response.json();
            console.log(`✅ Successfully fetched ${taxonomyName} (attempt ${attempt + 1})`);
            return json;
          } catch (error: any) {
            const isTimeout = error.message === 'Request timeout';
            console.error(`Error fetching ${taxonomyName} (attempt ${attempt + 1}):`, isTimeout ? 'Request timeout' : error.message);
            
            // If timeout or network error and not last attempt, retry
            if (attempt < retries - 1) {
              console.log(`Retrying ${taxonomyName} (${isTimeout ? 'timeout' : 'network error'})...`);
              continue;
            }
            return { results: [] };
          }
        }
        return { results: [] };
      };

      // Search for selected specialty only (Dermatology)
      // If you want to also search for "General Practice", set INCLUDE_GENERAL_PRACTICE to true
      const INCLUDE_GENERAL_PRACTICE = false;
      
      let allResults: any[] = [];
      const seenNpis = new Set<string>();

      // Helper to get specialty from doctor record
      const getSpecialty = (doc: any): string => {
        const taxonomies = doc.taxonomies || [];
        if (taxonomies.length > 0 && taxonomies[0].desc) {
          return taxonomies[0].desc.toLowerCase();
        }
        return '';
      };

      const addUniqueResults = (results: any[], isGeneralPracticeSearch: boolean = false) => {
        if (results && Array.isArray(results)) {
          results.forEach((doc: any) => {
            const npi = doc.number;
            if (npi && !seenNpis.has(npi)) {
              // If this is from "General Practice" search, filter by specialty
              if (isGeneralPracticeSearch) {
                const specialty = getSpecialty(doc);
                // Only include if specialty is "General Practice", "General Specialty", or "Dermatology"
                const allowedSpecialties = ['general practice', 'general specialty', 'dermatology'];
                if (!allowedSpecialties.includes(specialty)) {
                  return; // Skip this doctor
                }
              }
              seenNpis.add(npi);
              allResults.push(doc);
            }
          });
        }
      };

      // Search for selected specialty (Dermatology)
      const json1 = await fetchWithRetry(selected, selected);
      addUniqueResults(json1.results, false);

      // Optionally search for General Practice as well
      if (INCLUDE_GENERAL_PRACTICE && selected.toLowerCase() !== 'general practice') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between calls
        const json2 = await fetchWithRetry('General Practice', 'General Practice');
        addUniqueResults(json2.results, true);  // General Practice search - filter by specialty
      }

      // Filter by city if we have a city name (case-insensitive)
      let filteredResults = allResults;
      
      if (userCity) {
        filteredResults = allResults.filter((doc: any) => {
          const addresses = doc.addresses || [];
          const locationAddress = addresses.find((addr: any) => addr.address_purpose === 'LOCATION') || addresses[0] || {};
          const docCity = locationAddress.city || '';
          return docCity.toLowerCase() === userCity.toLowerCase();
        });
      }

      if (filteredResults.length === 0 && userCity && allResults.length > 0) {
        // If no results for the city, try to find nearby cities
        console.warn(`No results found for city "${userCity}", trying nearby cities...`);
        
        // Get unique cities from all results
        const citiesWithCoords = new Map<string, { lat: number; lon: number }>();
        
        // First, try to geocode a few cities to find nearby ones
        const citySamples = new Set<string>();
        allResults.forEach((doc: any) => {
          const addresses = doc.addresses || [];
          const locationAddress = addresses.find((addr: any) => addr.address_purpose === 'LOCATION') || addresses[0] || {};
          const docCity = (locationAddress.city || '').trim();
          if (docCity && docCity.toLowerCase() !== userCity.toLowerCase()) {
            citySamples.add(docCity);
          }
        });
        
        // Geocode user's city to get reference point
        let userCityLat: number | undefined;
        let userCityLon: number | undefined;
        if (userLat && userLon) {
          userCityLat = userLat;
          userCityLon = userLon;
        } else {
          try {
            const userCityGeo = await Location.geocodeAsync(`${userCity}, ${state}`);
            if (userCityGeo.length > 0) {
              userCityLat = userCityGeo[0].latitude;
              userCityLon = userCityGeo[0].longitude;
            }
          } catch (err) {
            console.warn('Failed to geocode user city:', err);
          }
        }
        
        // If we have user city coordinates, find nearby cities
        if (userCityLat && userCityLon) {
          const nearbyCities = new Set<string>();
          const maxDistance = 20; // miles
          
          // Sample up to 20 cities to check distance
          const citiesToCheck = Array.from(citySamples).slice(0, 20);
          
          for (const cityName of citiesToCheck) {
            try {
              const cityGeo = await Location.geocodeAsync(`${cityName}, ${state}`);
              if (cityGeo.length > 0) {
                const cityLat = cityGeo[0].latitude;
                const cityLon = cityGeo[0].longitude;
                const distance = calculateDistance(userCityLat, userCityLon, cityLat, cityLon);
                
                if (distance <= maxDistance) {
                  nearbyCities.add(cityName);
                  citiesWithCoords.set(cityName, { lat: cityLat, lon: cityLon });
                }
              }
            } catch (err) {
              // Skip cities that fail to geocode
              continue;
            }
          }
          
          // Filter results to nearby cities
          if (nearbyCities.size > 0) {
            filteredResults = allResults.filter((doc: any) => {
              const addresses = doc.addresses || [];
              const locationAddress = addresses.find((addr: any) => addr.address_purpose === 'LOCATION') || addresses[0] || {};
              const docCity = (locationAddress.city || '').trim();
              return nearbyCities.has(docCity);
            });
            console.log(`Found ${filteredResults.length} results in ${nearbyCities.size} nearby cities`);
          }
        }
        
        // If still no results (or couldn't find nearby cities), fall back to all results
        // They will be sorted by distance later
        if (filteredResults.length === 0) {
          const zipDisplay = zip ? `zipcode ${zip} (${state})` : state;
          console.warn(`No nearby cities found, showing closest results from ${zipDisplay} (sorted by distance)`);
          filteredResults = allResults;
        }
      } else if (filteredResults.length === 0) {
        console.warn(`No results found`);
      }

      // Helper function to find the best matching taxonomy
      // Priority: 1) Dermatology-related, 2) General Practice, 3) null (filter out)
      const findBestTaxonomy = (taxonomies: any[]): string | null => {
        if (!taxonomies || taxonomies.length === 0) {
          return null;
        }

        const dermatologyKeywords = ['dermatology', 'dermatologist', 'dermatologic', 'skin'];
        const generalPracticeKeywords = ['general practice', 'general specialty', 'family practice', 'primary care'];

        // First, look for Dermatology-related specialties
        for (const taxonomy of taxonomies) {
          const desc = (taxonomy.desc || '').toLowerCase();
          if (dermatologyKeywords.some(keyword => desc.includes(keyword))) {
            return taxonomy.desc; // Return original case
          }
        }

        // Second, look for General Practice
        for (const taxonomy of taxonomies) {
          const desc = (taxonomy.desc || '').toLowerCase();
          if (generalPracticeKeywords.some(keyword => desc.includes(keyword))) {
            return taxonomy.desc; // Return original case
          }
        }

        // If neither found, filter out this doctor
        return null;
      };

      // Filter doctors by taxonomy before processing
      const doctorsWithValidTaxonomy = filteredResults.filter((doc: any) => {
        const taxonomies = doc.taxonomies || [];
        return findBestTaxonomy(taxonomies) !== null;
      });

      if (doctorsWithValidTaxonomy.length === 0) {
        console.warn('No doctors found with matching specialties');
      }

      // Helper function to geocode with retry and rate limiting
      const geocodeWithRetry = async (mapQuery: string, retries = 2): Promise<{ latitude?: number; longitude?: number }> => {
        for (let i = 0; i <= retries; i++) {
          try {
            // Add small delay to avoid rate limiting (50ms between requests)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 100 * i));
            }
            const geoResults = await Location.geocodeAsync(mapQuery);
            if (geoResults && geoResults.length > 0) {
              return {
                latitude: geoResults[0].latitude,
                longitude: geoResults[0].longitude
              };
            }
          } catch (err: any) {
            // If it's the last retry, log the error
            if (i === retries) {
              console.warn(`Geocoding failed for "${mapQuery}" after ${retries + 1} attempts:`, err.message);
            }
            // Continue to next retry or return undefined
          }
        }
        return {};
      };

      // Parse all doctors and get coordinates with batching to avoid rate limits
      const batchSize = 10; // Process 10 doctors at a time
      const parsed: Doctor[] = [];
      
      for (let i = 0; i < doctorsWithValidTaxonomy.length; i += batchSize) {
        const batch = doctorsWithValidTaxonomy.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (doc: any) => {
        const basic = doc.basic || {};
            
            // Find the address with address_purpose as "LOCATION"
            const addresses = doc.addresses || [];
            const locationAddress = addresses.find((addr: any) => addr.address_purpose === 'LOCATION') || addresses[0] || {};
            
        const name = `${basic.first_name || ''} ${basic.last_name || ''}`.trim();
            // Use the best matching taxonomy (already filtered, so this will always return a value)
            const specialty = findBestTaxonomy(doc.taxonomies || []) || 'N/A';
            const fullAddress = `${locationAddress.address_1 || ''} ${locationAddress.city || ''}, ${locationAddress.state || ''} ${formatZipCode(locationAddress.postal_code) || ''}`;
            const mapQuery = `${locationAddress.address_1 || ''}, ${locationAddress.city || ''}, ${locationAddress.state || ''}`;

            // Geocode address to get coordinates (with retry logic)
            let latitude: number | undefined;
            let longitude: number | undefined;
            
            if (locationAddress.address_1 && locationAddress.city && locationAddress.state) {
              const coords = await geocodeWithRetry(mapQuery);
              latitude = coords.latitude;
              longitude = coords.longitude;
            }

            // Calculate distance from user location if available
            let distance: number | undefined;
            if (userLat && userLon && latitude && longitude) {
              distance = calculateDistance(userLat, userLon, latitude, longitude);
            }

        return {
          name: name || doc.basic.organization_name || 'Unknown',
          specialty,
          address: fullAddress,
              mapQuery,
              latitude,
              longitude,
              distance
            };
          })
        );
        parsed.push(...batchResults);
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < filteredResults.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Filter doctors with coordinates and sort by distance
      const doctorsWithCoords = parsed.filter(d => d.latitude && d.longitude);
      
      // Sort by distance (closest first), then limit to top 20
      const sortedDoctors = doctorsWithCoords
        .sort((a, b) => {
          const distA = a.distance ?? Infinity;
          const distB = b.distance ?? Infinity;
          return distA - distB;
        })
        .slice(0, 20);
      
      setDoctors(sortedDoctors);
      
      // Save filtered results to file and console (for sharing actual API results)
      if (ENABLE_SAVE_RESULTS && sortedDoctors.length > 0) {
        saveFilteredResults(sortedDoctors, zip || 'unknown', selected);
      }
      
      // Update map region to show doctors
      if (sortedDoctors.length > 0) {
        const avgLat = sortedDoctors.reduce((sum, d) => sum + (d.latitude || 0), 0) / sortedDoctors.length;
        const avgLon = sortedDoctors.reduce((sum, d) => sum + (d.longitude || 0), 0) / sortedDoctors.length;
        setMapRegion({
          latitude: avgLat,
          longitude: avgLon,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
      
      // If we have user location, center map on user
      if (location) {
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(API_KEY);

  async function getGeminiResponse(msg: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: "Hi" }] },
          { role: "model", parts: [{ text: "Hello! How can I assist you today?" }] },
        ]
      });
      const result = await chat.sendMessage(msg);
      return result.response.text();
    } catch (error) {
      console.error("Gemini error:", error);
      return "Sorry, something went wrong.";
    }
  }

  const openInMaps = (query: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Failed to open Maps'));
  };

  const capitalize = (str: string) => {
    if (str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    return '';
  }

  const generateMapHTML = () => {
    const doctorsWithCoords = doctors.filter(d => d.latitude && d.longitude);
    
    // Get Google Maps API key from environment
    const mapsApiKey = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || '';
    
    if (!mapsApiKey) {
      console.warn('Google Maps API key not found');
    }
    
    // Calculate center point
    let centerLat = location?.coords.latitude || mapRegion.latitude;
    let centerLon = location?.coords.longitude || mapRegion.longitude;
    
    if (doctorsWithCoords.length > 0) {
      // Use average of doctor locations if available
      const avgLat = doctorsWithCoords.reduce((sum, d) => sum + (d.latitude || 0), 0) / doctorsWithCoords.length;
      const avgLon = doctorsWithCoords.reduce((sum, d) => sum + (d.longitude || 0), 0) / doctorsWithCoords.length;
      
      // If user location exists, use it; otherwise use average of doctors
      if (!location) {
        centerLat = avgLat;
        centerLon = avgLon;
      }
    }
    
    // Create markers data for all doctors
    const markersData = doctorsWithCoords.map((doctor, index) => {
      const escapedName = (doctor.name || 'Doctor').replace(/'/g, "\\'").replace(/"/g, "&quot;");
      const escapedSpecialty = (doctor.specialty || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
      return {
        lat: doctor.latitude,
        lng: doctor.longitude,
        name: escapedName,
        specialty: escapedSpecialty,
        label: (index + 1).toString()
      };
    });
    
    // Use Maps JavaScript API to show multiple markers
    // This is more flexible than Embed API and supports multiple markers
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              height: 100%;
              width: 100%;
              overflow: hidden;
            }
            #map {
              height: 100%;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            function initMap() {
              const center = { lat: ${centerLat}, lng: ${centerLon} };
              const map = new google.maps.Map(document.getElementById('map'), {
                zoom: ${doctorsWithCoords.length > 0 ? 12 : 10},
                center: center,
                mapTypeId: 'roadmap'
              });

              // Add user location marker if available
              ${location ? `
                new google.maps.Marker({
                  position: { lat: ${location.coords.latitude}, lng: ${location.coords.longitude} },
                  map: map,
                  title: 'Your Location',
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                  },
                  label: {
                    text: 'You',
                    color: '#4285F4',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }
                });
              ` : ''}

              // Add markers for all doctors
              const markers = ${JSON.stringify(markersData)};
              
              const bounds = new google.maps.LatLngBounds();
              ${location ? `bounds.extend(new google.maps.LatLng(${location.coords.latitude}, ${location.coords.longitude}));` : ''}
              
              markers.forEach((markerData) => {
                const marker = new google.maps.Marker({
                  position: { lat: markerData.lat, lng: markerData.lng },
                  map: map,
                  title: markerData.name,
                  label: markerData.label
                });

                const infoWindow = new google.maps.InfoWindow({
                  content: '<div style="padding: 8px;"><strong>' + markerData.name + '</strong><br>' + markerData.specialty + '</div>'
                });

                marker.addListener('click', () => {
                  infoWindow.open(map, marker);
                });
                
                bounds.extend(new google.maps.LatLng(markerData.lat, markerData.lng));
              });

              // Fit bounds to show all markers
              if (markers.length > 0 || ${location ? 'true' : 'false'}) {
                map.fitBounds(bounds);
              }
            }
          </script>
          <script async defer
            src="https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&callback=initMap">
          </script>
        </body>
      </html>
    `;
  };

  console.log(zipCode, city)
  console.log("doctors", doctors)
  return (
    <View style={styles.container}>

      <View style={styles.pillContainer}>
        <View style={{ alignItems: 'center', marginBottom: 6 }}>
          <TouchableOpacity
            style={styles.pill}
            activeOpacity={0.8}
            onPress={() => setEditingZip(true)}
          >
            <View style={styles.pillTopRow}>
              <Ionicons name="location-sharp" size={16} color="#000" style={{ marginRight: 4 }} />
              <Text style={styles.pillZip}>{zipCode || ''}</Text>
              <Ionicons name="chevron-down" size={16} color="#000" style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.pillCity}>{city || 'City'}</Text>
          </TouchableOpacity>
        </View>
        <Modal visible={editingZip} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalLabel}>Enter ZIP Code:</Text>
              <TextInput
                style={styles.input}
                value={zipInput}
                onChangeText={setZipInput}
                keyboardType="numeric"
                maxLength={5}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setEditingZip(false)} style={styles.cancelBtn}>
                  <Text style={{ color: '#555' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    const trimmed = zipInput.trim();
                    if (trimmed.length === 5) {
                      setZipCode(trimmed);
                      setEditingZip(false);

                      try {
                        const user = auth.currentUser;
                        if (user) {
                          const userRef = doc(db, "users", user.uid);
                          await updateDoc(userRef, { zipCode: trimmed });
                          console.log("Zip code saved to Firestore");
                        }
                      } catch (err) {
                        console.error("Failed to update Firestore:", err);
                        Alert.alert("Firestore Error", "Failed to save ZIP code.");
                      }

                      // Get coordinates from zip code for distance calculation and update city
                      try {
                        const geoResults = await Location.geocodeAsync(trimmed);
                        if (geoResults.length > 0) {
                          const { latitude, longitude } = geoResults[0];
                          setLocation({
                            coords: { latitude, longitude, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null },
                            timestamp: Date.now()
                          } as Location.LocationObject);
                          
                          // Get city name from reverse geocoding
                          try {
                            const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
                            if (reverse[0]) {
                              const { city, subregion, region } = reverse[0];
                              setCity(city || subregion || region || '');
                            }
                          } catch (reverseErr) {
                            console.warn('Failed to get city from zip code:', reverseErr);
                          }
                          
                          fetchDoctors(latitude, longitude, trimmed, selectedSpecialty);
                        } else {
                          // If geocoding fails, still try to fetch doctors but clear city
                          setCity('');
                          fetchDoctors(undefined, undefined, trimmed, selectedSpecialty);
                        }
                      } catch (err) {
                        // If geocoding fails, still try to fetch doctors but clear city
                        setCity('');
                        fetchDoctors(undefined, undefined, trimmed, selectedSpecialty);
                      }

                    } else {
                      Alert.alert("Invalid ZIP", "Please enter a valid 5-digit ZIP code.");
                    }
                  }}
                  style={styles.saveBtn}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      <View style={styles.specialtyContainer}>
        <Text style={styles.specialtyText}>
          Specialty: {capitalize(specValue || '')}
        </Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="pencil" size={20} color="black" style={styles.iconStyle} />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
          <DropDownPicker
            open={groupOpen}
            value={groupValue}
            items={groupItems}
            setOpen={setGroupOpen}
            setValue={setGroupValueInDropdown}
            setItems={setGroupItems}
            placeholder="Select Group"
            zIndex={3000}
            zIndexInverse={1000}
          />

          <DropDownPicker
            open={classOpen}
            value={classValue}
            items={classItems}
            setOpen={setClassOpen}
            setValue={setClassValue}
            setItems={setClassItems}
            placeholder="Select Classification"
            zIndex={2000}
            zIndexInverse={2000}
          />

          <DropDownPicker
            open={specOpen}
            value={specValue}
            items={specItems}
            setOpen={setSpecOpen}
            setValue={setSpecValue}
            setItems={setSpecItems}
            placeholder="Select Specialization"
            zIndex={1000}
            zIndexInverse={3000}
          />
            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                if (specValue) {
                  setSelectedSpecialty(specValue);
                  // Pass location coordinates if available
                  const userLat = location?.coords.latitude;
                  const userLon = location?.coords.longitude;
                  fetchDoctors(userLat, userLon, zipCode, specValue);
                  setModalVisible(false);
                } else {
                  Alert.alert("Select Specialization", "Please choose a valid specialization.");
                }
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Confirm</Text>
            </TouchableOpacity>

            {/* Optional Cancel Button */}
            <TouchableOpacity
              style={{ marginTop: 10 }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#666', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Toggle between Map and List */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, showMap && styles.toggleButtonActive]}
          onPress={() => setShowMap(true)}
        >
          <Ionicons name="map" size={20} color={showMap ? '#fff' : '#666'} />
          <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !showMap && styles.toggleButtonActive]}
          onPress={() => setShowMap(false)}
        >
          <Ionicons name="list" size={20} color={!showMap ? '#fff' : '#666'} />
          <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>List</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={{ color: 'red', fontSize: 16 }}>{error}</Text>
        </View>
      ) : showMap ? (
        <View style={styles.mapContainer}>
          <WebView
            style={styles.map}
            source={{
              html: generateMapHTML(),
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
          />
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item, idx) => `${item.name}-${idx}`}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openInMaps(item.mapQuery)}>
              <View style={styles.cardContent}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.specialty}>{item.specialty}</Text>
                  <Text style={styles.address}>{item.address}</Text>
                  {item.distance !== undefined && (
                    <Text style={styles.distance}>{item.distance.toFixed(1)} miles away</Text>
                  )}
                </View>
                <Ionicons name="location-outline" size={20} color="#A5CCC9" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  card: {
    backgroundColor: '#DBEDEC',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A5CCC9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  specialty: { fontSize: 14, color: '#2c3e50', marginTop: 4 },
  address: { fontSize: 13, color: '#555', marginTop: 4 },
  distance: { fontSize: 12, color: '#A5CCC9', marginTop: 4, fontWeight: '500' },
  errorContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center'
  },
  specialtyContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  specialtyText: { fontSize: 16, fontWeight: 'bold' },
  editButton: { marginLeft: 10, color: 'blue' },
  specialtyItem: { padding: 10, fontSize: 16 },
  iconStyle: { marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 10,
    padding: 16,
    maxHeight: 400
  },
  pillContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    minWidth: 80,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pillTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  pillZip: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  
  pillCity: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
  },
  zipInput: {
    borderBottomWidth: 1,
    borderColor: '#aaa',
    fontSize: 16,
    minWidth: 80,
    color: '#000',
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: '#f5f7fa',
    borderRadius: 4
  },
  modalBox: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    width: '60%',
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  cancelBtn: {
    padding: 10,
  },
  saveBtn: {
    backgroundColor: '#2c3e50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#2c3e50',
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
    height: Dimensions.get('window').height * 0.6,
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});