// TravelSathi Master Dataset — Authentic Indian Tourism Ecosystem

export const DESTINATIONS = [
  {
    id: "dest-1",
    name: "Tirthan Valley",
    state: "Himachal Pradesh",
    region: "Kullu District",
    category: "Nature",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    ],
    overview: "Nestled along the pristine Tirthan River at the gateway to the Great Himalayan National Park (UNESCO World Heritage Site), Tirthan Valley offers quiet riverside retreats, trout fishing, and traditional wood-and-stone Kathkuni architecture.",
    bestTime: "March to June & September to November",
    weather: { temp: "19°C", condition: "Pleasant", rainChance: "10%", airQuality: "AQI 24 (Pristine)" },
    idealDuration: "3 - 4 Days",
    crowdLevel: "Low",
    crowdCapacityPct: 32,
    crowdStatus: "Low visitor density. Pristine quiet trails with high local availability.",
    safetyScore: 94,
    safetyStatus: "Safe",
    costTier: "Moderate",
    costAvgDay: 2600,
    accessibility: { wheelchair: true, elderlyFriendly: true, stepFreeRooms: true },
    sustainability: { ecoScore: 96, plasticFreeZone: true, localRevenueSharePct: 92 },
    isPopular: false,
    isHiddenGem: true,
    hiddenGemReason: "A serene, uncrowded alternative to Manali (52 km away) with 65% lower visitor density, authentic Kathkuni homestays, and direct access to pristine UNESCO Himalayan trails.",
    lat: 31.6425,
    lng: 77.3481,
    attractions: ["Great Himalayan National Park", "Choi Waterfall", "Serolsar Lake Trek", "Chehni Kothi Tower"],
    etiquette: {
      dressCode: "Modest casuals; warm thermal layers during evenings.",
      photography: "Freely permitted in nature; request permission before photographing villagers.",
      customs: "Remove shoes when entering sacred village deodar wooden temples.",
      tipping: "5-10% appreciated for local mountain guides."
    }
  },
  {
    id: "dest-2",
    name: "Bastar Tribal Heritage Circuit",
    state: "Chhattisgarh",
    region: "Bastar Plateau",
    category: "Rural",
    image: "https://images.unsplash.com/photo-1609137144822-4a0b2308cf26?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1609137144822-4a0b2308cf26?auto=format&fit=crop&w=800&q=80"
    ],
    overview: "Under the PM-JUGA tribal development scheme, Bastar connects travelers directly to Gond and Maria tribal artisans practicing 4,000-year-old Dhokra lost-wax bronze casting and bell-metal art.",
    bestTime: "October to March",
    weather: { temp: "26°C", condition: "Sunny", rainChance: "5%", airQuality: "AQI 38 (Good)" },
    idealDuration: "4 - 5 Days",
    crowdLevel: "Low",
    crowdCapacityPct: 18,
    crowdStatus: "Very quiet. Ideal for cultural immersion and craft exploration.",
    safetyScore: 89,
    safetyStatus: "Safe",
    costTier: "Budget",
    costAvgDay: 1800,
    accessibility: { wheelchair: false, elderlyFriendly: true, stepFreeRooms: true },
    sustainability: { ecoScore: 98, plasticFreeZone: true, localRevenueSharePct: 97 },
    isPopular: false,
    isHiddenGem: true,
    hiddenGemReason: "Zero commercialized OTA exploitation. 100% of booking revenue stays with local Gond tribal community cooperatives.",
    lat: 19.0748,
    lng: 82.0298,
    attractions: ["Chitrakote Horseshoe Falls", "Tirathgarh Cascades", "Kondagaon Bell Metal Craft Village", "Kanger Ghati Caves"],
    etiquette: {
      dressCode: "Respectful, non-revealing clothing covering shoulders and knees.",
      photography: "Always ask tribal elders before taking portrait photos.",
      customs: "Do not touch sacred ancestral totems in village groves.",
      tipping: "Purchase handicrafts directly from artisans rather than cash tipping."
    }
  },
  {
    id: "dest-3",
    name: "Jaipur & Amer Heritage Corridor",
    state: "Rajasthan",
    region: "Dhundhar",
    category: "Heritage",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80"
    ],
    overview: "The Pink City of Rajasthan is renowned for UNESCO World Heritage sites including Amer Fort, Jantar Mantar, and Hawa Mahal, alongside world-famous block printing and blue pottery artisan clusters.",
    bestTime: "October to March",
    weather: { temp: "28°C", condition: "Warm & Clear", rainChance: "0%", airQuality: "AQI 118 (Moderate)" },
    idealDuration: "3 Days",
    crowdLevel: "Very Busy",
    crowdCapacityPct: 88,
    crowdStatus: "High visitor density at Amer Fort (88% capacity). TravelSathi recommends Jaigarh Fort or Nahargarh sunrise slots to avoid congestion.",
    safetyScore: 88,
    safetyStatus: "Safe",
    costTier: "Moderate",
    costAvgDay: 3500,
    accessibility: { wheelchair: true, elderlyFriendly: true, stepFreeRooms: true },
    sustainability: { ecoScore: 78, plasticFreeZone: false, localRevenueSharePct: 76 },
    isPopular: true,
    isHiddenGem: false,
    hiddenGemReason: "Popular destination. TravelSathi offers smart crowd-diverted routing for quieter morning slots.",
    lat: 26.9124,
    lng: 75.7873,
    attractions: ["Amer Fort", "City Palace", "Hawa Mahal", "Jantar Mantar", "Panna Meena Ka Kund"],
    etiquette: {
      dressCode: "Cover shoulders and knees inside temples and palaces.",
      photography: "Tripods require ASI ticket at Amer; mobile photography permitted.",
      customs: "Bargain respectfully in traditional bazaars like Johari and Bapu.",
      tipping: "10% standard in restaurants; ₹100-200 for luggage assistance."
    }
  },
  {
    id: "dest-4",
    name: "Munnar & Marayoor Sandalwood Forest",
    state: "Kerala",
    region: "Idukki District",
    category: "Nature",
    image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80"
    ],
    overview: "Roll through mist-clad tea plantations in the Western Ghats, ancient megalithic dolmens in Marayoor, natural sandalwood forests, and spice gardens managed by local farmer self-help groups.",
    bestTime: "September to May",
    weather: { temp: "21°C", condition: "Misty & Refreshing", rainChance: "20%", airQuality: "AQI 22 (Pristine)" },
    idealDuration: "3 - 4 Days",
    crowdLevel: "Moderate",
    crowdCapacityPct: 54,
    crowdStatus: "Moderate flow in tea estates; Marayoor valley remains tranquil and unhurried.",
    safetyScore: 96,
    safetyStatus: "Safe",
    costTier: "Moderate",
    costAvgDay: 3100,
    accessibility: { wheelchair: true, elderlyFriendly: true, stepFreeRooms: true },
    sustainability: { ecoScore: 94, plasticFreeZone: true, localRevenueSharePct: 88 },
    isPopular: true,
    isHiddenGem: false,
    hiddenGemReason: "Combine main Munnar tea hills with the hidden Marayoor Neolithic Dolmens for an authentic, uncrowded cultural experience.",
    lat: 10.0889,
    lng: 77.0595,
    attractions: ["Eravikulam National Park", "Mattupetty Lake", "Marayoor Sandalwood Forest", "Dolmens of Muniyara"],
    etiquette: {
      dressCode: "Light woolens for mornings and evenings; comfortable walking shoes.",
      photography: "Allowed everywhere; ask workers before taking portraits in tea fields.",
      customs: "Eco-tourism guidelines strictly forbid littering tea gardens.",
      tipping: "10% at plantation homestays."
    }
  },
  {
    id: "dest-5",
    name: "Ziro Valley & Apatani Plateau",
    state: "Arunachal Pradesh",
    region: "Lower Subansiri",
    category: "Culture",
    image: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80"
    ],
    overview: "A UNESCO tentative world heritage landscape, Ziro Valley is famous for the Apatani tribe's sustainable co-cultivation of rice and fish, traditional bamboo architecture, and sacred pine groves.",
    bestTime: "March to October",
    weather: { temp: "18°C", condition: "Crisp & Clear", rainChance: "15%", airQuality: "AQI 16 (Pristine)" },
    idealDuration: "4 Days",
    crowdLevel: "Low",
    crowdCapacityPct: 22,
    crowdStatus: "Low crowd density outside of the annual music festival. High peace and tranquility.",
    safetyScore: 93,
    safetyStatus: "Safe",
    costTier: "Budget",
    costAvgDay: 2200,
    accessibility: { wheelchair: false, elderlyFriendly: false, stepFreeRooms: true },
    sustainability: { ecoScore: 99, plasticFreeZone: true, localRevenueSharePct: 95 },
    isPopular: false,
    isHiddenGem: true,
    hiddenGemReason: "Zero commercial hotels. All hospitality is run by Apatani family homestays providing genuine farm-to-table indigenous organic meals.",
    lat: 27.5950,
    lng: 93.8340,
    attractions: ["Kardo Shiva Lingam", "Tarin Fish Farm", "Hong Apatani Village", "Talley Valley Wildlife Sanctuary"],
    etiquette: {
      dressCode: "Casual, practical outdoors wear with warm layers.",
      photography: "Ask elder women before photographing traditional facial tattoos (Yaping Hullo).",
      customs: "Inner Line Permit (ILP) required for non-Arunachal citizens; easily arranged via TravelSathi.",
      tipping: "Local hosts prefer heartfelt gratitude and gift exchange over cash tips."
    }
  },
  {
    id: "dest-6",
    name: "Hampi Boulder & Ruins Circuit",
    state: "Karnataka",
    region: "Vijayanagara District",
    category: "Heritage",
    image: "https://images.unsplash.com/photo-1600100397608-f010e42e4e8a?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600100397608-f010e42e4e8a?auto=format&fit=crop&w=800&q=80"
    ],
    overview: "The legendary capital of the 14th-century Vijayanagara Empire on the banks of Tungabhadra River, featuring surreal granite boulder hills, musical stone pillars, and coracle boat river crossings.",
    bestTime: "October to February",
    weather: { temp: "27°C", condition: "Sunny & Breezy", rainChance: "0%", airQuality: "AQI 42 (Good)" },
    idealDuration: "3 Days",
    crowdLevel: "Moderate",
    crowdCapacityPct: 58,
    crowdStatus: "Moderate footfall. Early morning at Virupaksha and Matanga Hill offers solitary sunrise experiences.",
    safetyScore: 92,
    safetyStatus: "Safe",
    costTier: "Budget",
    costAvgDay: 2100,
    accessibility: { wheelchair: true, elderlyFriendly: true, stepFreeRooms: true },
    sustainability: { ecoScore: 88, plasticFreeZone: true, localRevenueSharePct: 84 },
    isPopular: true,
    isHiddenGem: false,
    hiddenGemReason: "Famous ruins, but TravelSathi routes you to the quieter Anegundi side across the river for rural village immersion.",
    lat: 15.3350,
    lng: 76.4600,
    attractions: ["Virupaksha Temple", "Vijaya Vittala Stone Chariot", "Lotus Mahal", "Matanga Hill Sunrise", "Anegundi Village"],
    etiquette: {
      dressCode: "Conservative attire for active religious shrines.",
      photography: "Allowed in monuments; not inside active sanctum sanctorum.",
      customs: "Do not climb ancient structural walls or stone lintels.",
      tipping: "Standard ₹200 for ASI certified local storytelling guides."
    }
  }
];

export const EXPERIENCES = [
  {
    id: "exp-1",
    title: "Dhokra Lost-Wax Bell Metal Craft Workshop",
    hostName: "Manglu Ram Baghel",
    hostRole: "Master Craftsman & National Awardee",
    hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    isVerified: true,
    verificationReason: "PM-Vikas Certified Artisan, verified via DigiLocker eKYC & Ministry of Tribal Affairs artisan registry.",
    location: "Kondagaon, Bastar",
    state: "Chhattisgarh",
    category: "Handicrafts & Art",
    duration: "3.5 Hours",
    pricePerPerson: 850,
    taxes: 0,
    platformFee: 0,
    totalPrice: 850,
    rating: 4.96,
    reviewCount: 142,
    image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80",
    description: "Learn the 4,000-year-old Indus Valley lost-wax brass casting technique from 4th generation masters. Sculpt your own bronze figurine from beeswax and clay mold, fired in a traditional earthen kiln.",
    scheduleSlots: ["09:30 AM", "02:30 PM"],
    accessibilityOptions: "Wheelchair accessible ground floor workshop, tactile learning.",
    ecoFriendly: true,
    supportLocalMessage: "100% of this fee goes directly to the Kondagaon Artisan Cooperative with zero platform commission deduction."
  },
  {
    id: "exp-2",
    title: "Tirthan Himalayan River Walk & Kathkuni Architecture Tour",
    hostName: "Tara Chand Sharma",
    hostRole: "Village Elder & Kathkuni Carpenter",
    hostAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    isVerified: true,
    verificationReason: "Himachal Tourism Board Registered Eco-Guide (Badge #HP-KLL-1049).",
    location: "Gushaini, Tirthan Valley",
    state: "Himachal Pradesh",
    category: "Heritage & Nature",
    duration: "4 Hours",
    pricePerPerson: 1200,
    taxes: 0,
    platformFee: 0,
    totalPrice: 1200,
    rating: 4.98,
    reviewCount: 98,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    description: "Walk along clear trout streams and pine forests to explore ancient earthquake-resistant deodar wood and stone Kathkuni multi-story homes, followed by traditional Siddu steamed bread tasting with wild honey.",
    scheduleSlots: ["08:30 AM", "03:00 PM"],
    accessibilityOptions: "Moderate trail walking; walking sticks provided.",
    ecoFriendly: true,
    supportLocalMessage: "Supports sustainable village timber preservation and youth mountain guiding."
  },
  {
    id: "exp-3",
    title: "Organic Spice Trail & Farm Cooking Experience",
    hostName: "Lalitha & Kunjumon",
    hostRole: "Organic Spice Farmers",
    hostAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    isVerified: true,
    verificationReason: "Spices Board of India Organic Certified (Cert #SB-ORG-8821).",
    location: "Kumily, Thekkady",
    state: "Kerala",
    category: "Food & Farming",
    duration: "3 Hours",
    pricePerPerson: 1100,
    taxes: 0,
    platformFee: 0,
    totalPrice: 1100,
    rating: 4.92,
    reviewCount: 215,
    image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80",
    description: "Harvest green cardamom, wild cinnamon, black pepper, and nutmeg from heritage trees, then cook an authentic Kerala sadya meal served on banana leaves in an open-air farm kitchen.",
    scheduleSlots: ["10:00 AM", "04:00 PM"],
    accessibilityOptions: "Flat farm paths, sit-down kitchen benches.",
    ecoFriendly: true,
    supportLocalMessage: "Directly funds the organic seed bank preservation in Periyar buffer zone."
  }
];

export const HOMESTAYS = [
  {
    id: "stay-1",
    name: "Pine Shade Kathkuni Homestay",
    hostName: "Sunil & Meena Thakur",
    isVerified: true,
    verificationBadge: "Swadesh Darshan Certified Eco-Stay",
    location: "Gushaini, Tirthan Valley",
    state: "Himachal Pradesh",
    pricePerNight: 2400,
    taxes: 0,
    cleaningFee: 0,
    rating: 4.95,
    reviewsCount: 88,
    amenities: ["Kathkuni Wood Fireplace", "Mountain River View", "Organic Home Meals", "High-Speed WiFi", "Solar Heated Water"],
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    description: "Built entirely with local river stones and deodar wood without any mortar or cement. Wake up to the murmur of Tirthan River and savor hot Siddu with apricot jam prepared by Meena ji.",
    ecoScore: 98,
    accessibilityFeatures: ["Ground floor room available", "Wide 36-inch doors", "Step-free patio"],
    supportLocalNote: "100% of tariff directly supports the family and local village milk cooperative."
  },
  {
    id: "stay-2",
    name: "Bastar Munda Heritage Tribal Lodge",
    hostName: "Budhram & Sunita Netam",
    isVerified: true,
    verificationBadge: "PM-JUGA Tribal Homestay Partner",
    location: "Chitrakote Road, Bastar",
    state: "Chhattisgarh",
    pricePerNight: 1600,
    taxes: 0,
    cleaningFee: 0,
    rating: 4.88,
    reviewsCount: 64,
    amenities: ["Traditional Earthen Veranda", "Mahua Flower Tea", "Artisan Workshops Nearby", "Filtered Well Water", "Cultural Storytelling"],
    image: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80",
    description: "An authentic Gond tribal mud-and-thatch retreat adorned with traditional Pithora mural art. Enjoy fresh roasted millet rotis, red ant chutney (chaprah) for adventurous foodies, and evening bell metal demonstrations.",
    ecoScore: 99,
    accessibilityFeatures: ["Single-level compound", "Assisted transfers from Jagdalpur station"],
    supportLocalNote: "Recognized under PM-JUGA for direct rural digital empowerment with zero OTA deductions."
  },
  {
    id: "stay-3",
    name: "Anegundi Heritage River Haveli",
    hostName: "Shrinivas Rao",
    isVerified: true,
    verificationBadge: "KSTDC Heritage Homestay #12",
    location: "Anegundi (Across Hampi Ruins)",
    state: "Karnataka",
    pricePerNight: 2800,
    taxes: 0,
    cleaningFee: 0,
    rating: 4.91,
    reviewsCount: 116,
    amenities: ["Banana Fiber Handicrafts", "Courtyard Temple", "Traditional Coracle Boats", "Bicycle Rentals", "South Indian Filter Coffee"],
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    description: "A 180-year-old restored tiled-roof home in Kishkindha's mythological landscape. Escape the Hampi bazaar rush, cycle past paddy fields, and cross the Tungabhadra on traditional round coracle boats.",
    ecoScore: 92,
    accessibilityFeatures: ["Ramp at front gate", "Accessible bathroom handle rails"],
    supportLocalNote: "Partner of The Kishkinda Trust promoting women's banana fiber craft clusters."
  }
];

export const EVENTS = [
  {
    id: "event-1",
    title: "Pushkar Camel Fair & Cultural Mela",
    dates: "November 14 – 22, 2026",
    location: "Pushkar, Rajasthan",
    state: "Rajasthan",
    category: "Heritage & Livestock",
    expectedCrowds: "High (Over 250,000 Expected)",
    transportAdvisory: "High rail & road congestion. Special electric shuttle buses running from Ajmer Junction.",
    nearbyStaysCount: 38,
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    description: "One of the world's largest camel and livestock fairs featuring camel races, music competitions, Rajasthani folk dance performances, and sacred Kartik Purnima lake rituals."
  },
  {
    id: "event-2",
    title: "Hornbill Festival of Nagaland",
    dates: "December 1 – 10, 2026",
    location: "Kisama Heritage Village, Kohima",
    state: "Nagaland",
    category: "Tribal & Music",
    expectedCrowds: "Moderate",
    transportAdvisory: "Book Dimapur to Kohima shared taxis 48 hours in advance. Dimapur airport operating daily flights.",
    nearbyStaysCount: 24,
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
    description: "The Festival of Festivals where 17 indigenous Naga tribes gather in traditional attire to celebrate heritage, folk songs, traditional archery, and indigenous gastronomy."
  },
  {
    id: "event-3",
    title: "Bastar Dussehra 75-Day Tribal Jubilee",
    dates: "October 8 – 24, 2026",
    location: "Jagdalpur, Bastar",
    state: "Chhattisgarh",
    category: "Sacred & Cultural",
    expectedCrowds: "Moderate",
    transportAdvisory: "Special express trains running between Raipur and Jagdalpur.",
    nearbyStaysCount: 19,
    image: "https://images.unsplash.com/photo-1609137144822-4a0b2308cf26?auto=format&fit=crop&w=800&q=80",
    description: "The world's longest cultural festival, not about Rama or Ravana, but honoring Goddess Danteshwari and tribal democracy through massive hand-crafted wooden chariots pulled by thousands."
  }
];

export const SAFETY_ALERTS = [
  {
    region: "Himachal Pradesh - High Altitude",
    level: "Caution",
    headline: "Autumn Frost & Evening Black Ice on Rohtang Pass",
    details: "Temperatures dropping to -3°C near passes after sunset. 4x4 vehicles advised past Marhi. Valleys remain open and safe.",
    lastUpdated: "Today, 08:30 AM IST",
    source: "Himachal State Disaster Management Authority"
  },
  {
    region: "Rajasthan Heritage Hotspots",
    level: "Safe",
    headline: "Clear Weather Across Jaipur, Udaipur, and Jodhpur",
    details: "All monuments open with regular hours. High daytime UV; carry sun protection and stay hydrated.",
    lastUpdated: "Today, 06:00 AM IST",
    source: "Rajasthan Tourism Security Wing"
  },
  {
    region: "Western Ghats High Ranges",
    level: "Safe",
    headline: "Green Clear Routes through Munnar & Wayanad",
    details: "Clear road conditions along NH 85. Light morning fog around tea estates between 5:00 AM and 7:30 AM.",
    lastUpdated: "Yesterday, 09:00 PM IST",
    source: "Kerala Highway Police Command"
  }
];

export const EMERGENCY_NUMBERS = [
  { service: "Unified National Emergency", number: "112", description: "Police, Fire, and Ambulance 24x7 all across India" },
  { service: "Tourist Police Helpline", number: "1363", description: "Multi-language travel emergency & tourist assistance" },
  { service: "Women Safety Helpline", number: "1091", description: "Direct 24/7 rapid response for solo women travelers" },
  { service: "Ambulance / Medical Emergency", number: "108", description: "State emergency medical response service" },
  { service: "Railway Security Helpline", number: "139", description: "On-train emergency assistance, security, and medical support" }
];

export const GOV_INTELLIGENCE_DATA = {
  macroMetrics: {
    totalArrivals: "4.82 Million",
    domesticShare: "84.2%",
    internationalShare: "15.8%",
    avgStayDays: "4.6 Days",
    totalEconomicImpactCr: "₹8,420 Cr",
    localCommunityShareCr: "₹5,894 Cr",
    carbonReductionTons: "18,400 T"
  },
  pressureIndexHotspots: [
    { destination: "Manali Mall & Solang Corridor", state: "Himachal", carryingCapacity: 14000, currentDensity: 19800, pressureLevel: "Critical", waterStress: "High", trafficIndex: 92, interventionNeeded: "Reroute traffic to Tirthan and Sainj valleys; restrict non-electric tourist buses." },
    { destination: "Baga & Calangute Coastal Strip", state: "Goa", carryingCapacity: 28000, currentDensity: 34500, pressureLevel: "High", waterStress: "Moderate", trafficIndex: 86, interventionNeeded: "Promote hinterland spice farms and Divar Island cultural circuits." },
    { destination: "Amer Fort Main Precinct", state: "Rajasthan", carryingCapacity: 12000, currentDensity: 13900, pressureLevel: "High", waterStress: "Low", trafficIndex: 78, interventionNeeded: "Incentivize Jaigarh, Nahargarh, and Panna Meena morning slots via ticket rebates." },
    { destination: "Tirthan Eco Valley", state: "Himachal", carryingCapacity: 4500, currentDensity: 1440, pressureLevel: "Low", waterStress: "Pristine", trafficIndex: 12, interventionNeeded: "Healthy sustainable capacity. Maintain green homestay standard." },
    { destination: "Bastar Tribal Handicrafts Belt", state: "Chhattisgarh", carryingCapacity: 6000, currentDensity: 1080, pressureLevel: "Low", waterStress: "Pristine", trafficIndex: 8, interventionNeeded: "Prime candidate for PM-JUGA digital marketing and artisan support." },
    { destination: "Ziro Valley Plateau", state: "Arunachal", carryingCapacity: 3500, currentDensity: 770, pressureLevel: "Low", waterStress: "Pristine", trafficIndex: 5, interventionNeeded: "Expand homestay capacity under strict environmental guidelines." }
  ],
  infrastructureGaps: [
    { district: "Kondagaon, Bastar", state: "Chhattisgarh", category: "EV Charging & Sanitation", severity: "High", description: "Need 4 DC fast-charging stations along NH-30 and 6 sanitized wayside public amenities.", targetTimeline: "Q2 2027" },
    { district: "Tirthan Valley, Kullu", state: "Himachal Pradesh", category: "Emergency Medical Post", severity: "Moderate", description: "Establishing 24/7 mountain trauma stabilization post at Banjar intersection.", targetTimeline: "Q4 2026" },
    { district: "Anegundi, Vijayanagara", state: "Karnataka", category: "Pedestrian River Ferry", severity: "Moderate", description: "Replace diesel ferries with solar-electric passenger catamaran to reduce river pollution.", targetTimeline: "Q1 2027" },
    { district: "Ziro Plateau", state: "Arunachal Pradesh", category: "Fiber Connectivity", severity: "High", description: "High-speed broadband expansion to 22 Apatani rural homestays under BharatNet.", targetTimeline: "Q3 2026" }
  ]
};
