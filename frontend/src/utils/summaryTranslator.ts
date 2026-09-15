/**
 * TravelSathi Multilingual Summary Translation Engine
 * Translates destination summaries, overviews, recommendation reasons,
 * and itinerary summaries into all 7 supported Indic languages:
 * en (English), hi (Hindi), mr (Marathi), bn (Bengali), ta (Tamil), te (Telugu), gu (Gujarati).
 */

export interface DestinationMetadata {
  id?: string | number;
  name?: string;
  state?: string;
  district?: string;
  region?: string;
  category?: string;
  summary?: string;
  overview?: string;
  description?: string;
  hiddenGemReason?: string;
  isHiddenGem?: boolean;
}

export interface ItineraryMetadata {
  id?: string;
  title?: string;
  state?: string;
  destination?: string;
  days?: number;
  summary?: string;
  budget?: string;
}

const CATEGORY_MAP: Record<string, Record<string, string>> = {
  culture: {
    en: 'Culture',
    hi: 'संस्कृति व कला',
    mr: 'संस्कृती व कला',
    bn: 'সংস্কৃতি ও কলা',
    ta: 'கலாச்சாரம் மற்றும் கலை',
    te: 'సంస్కృతి మరియు కళలు',
    gu: 'સંસ્કૃતિ અને કલા'
  },
  spiritual: {
    en: 'Spiritual',
    hi: 'आध्यात्मिक तीर्थ',
    mr: 'आध्यात्मिक तीर्थक्षेत्र',
    bn: 'আধ্যাত্মিক তীর্থস্থান',
    ta: 'ஆன்மீக தலம்',
    te: 'ఆధ్యాత్మిక పుణ్యక్షేత్రం',
    gu: 'આધ્યાત્મિક યાત્રાધામ'
  },
  heritage: {
    en: 'Heritage',
    hi: 'ऐतिहासिक धरोहर',
    mr: 'ऐतिहासिक वारसा',
    bn: 'ঐতিহাসিক ঐতিহ্য',
    ta: 'பாரம்பரியம்',
    te: 'చారిత్రక వారసత్వం',
    gu: 'વારસો'
  },
  nature: {
    en: 'Nature',
    hi: 'प्राकृतिक स्थल',
    mr: 'नैसर्गिक स्थळ',
    bn: 'প্রাকৃতিক পরিবেশ',
    ta: 'இயற்கை எழில்',
    te: 'ప్రకృతి రమణీయత',
    gu: 'કુદરતી સ્થળ'
  },
  mountains: {
    en: 'Mountains',
    hi: 'पर्वतीय स्थल',
    mr: 'डोंगर व पर्वत',
    bn: 'পাহাড় ও পর্বত',
    ta: 'மலைப்பிரதேசம்',
    te: 'పర్వత ప్రాంతం',
    gu: 'પર્વતીય સ્થળ'
  },
  beaches: {
    en: 'Beaches',
    hi: 'समुद्र तट',
    mr: 'समुद्रकिनारा',
    bn: 'সৈকত ও উপকূল',
    ta: 'கடற்கரை',
    te: 'బీచ్ తీరం',
    gu: 'દરિયાકિનારો'
  },
  wildlife: {
    en: 'Wildlife',
    hi: 'वन्यजीव अभयारण्य',
    mr: 'वन्यजीव राखीव क्षेत्र',
    bn: 'বন্যপ্রাণী সংরক্ষণাগার',
    ta: 'வனவிலங்கு சரணாலயம்',
    te: 'వన్యప్రాణుల సంరక్షణ కేంద్రం',
    gu: 'વન્યજીવ અભયારણ્ય'
  },
  adventure: {
    en: 'Adventure',
    hi: 'साहसिक पर्यटन',
    mr: 'साहसी पर्यटन',
    bn: 'রোমাঞ্চকর ভ্রমণ',
    ta: 'சாகச சுற்றுலா',
    te: 'సాహస యాత్ర',
    gu: 'સાહસિક પ્રવાસન'
  },
  shopping: {
    en: 'Shopping',
    hi: 'खरीदारी व बाज़ार',
    mr: 'खरेदी व बाजार',
    bn: 'কেনাকাটা ও বাজার',
    ta: 'ஷாப்பிங் மற்றும் சந்தை',
    te: 'షాపింగ్ మరియు బజార్',
    gu: 'ખરીદી અને બજાર'
  },
  food: {
    en: 'Food',
    hi: 'खान-पान व व्यंजन',
    mr: 'खाद्यसंस्कृती',
    bn: 'খাবার ও রান্না',
    ta: 'உணவு மற்றும் சுவை',
    te: 'ఆహారం మరియు వంటకాలు',
    gu: 'ખાનપાન'
  },
  rural: {
    en: 'Rural',
    hi: 'ग्रामीण अनुभव',
    mr: 'ग्रामीण जीवन',
    bn: 'গ্রামীণ অভিজ্ঞতা',
    ta: 'கிராமப்புற அனுபவம்',
    te: 'గ్రామీణ అనుభవం',
    gu: 'ગ્રામીણ અનુભવ'
  },
  wellness: {
    en: 'Wellness',
    hi: 'योग व कल्याण',
    mr: 'आरोग्य व योग',
    bn: 'সুস্বাস্থ্য ও যোগ',
    ta: 'ஆரோக்கியம் மற்றும் யோகா',
    te: 'ఆరోగ్యం మరియు యోగా',
    gu: 'આરોગ્ય અને યોગ'
  },
  homestay: {
    en: 'Homestay',
    hi: 'होमस्टे',
    mr: 'होमस्टे',
    bn: 'হোমস্টে',
    ta: 'ஹோம்ஸ்டே',
    te: 'హోమ్‌స్టే',
    gu: 'હોમસ્ટે'
  },
  restaurant: {
    en: 'Restaurant',
    hi: 'रेस्तरां',
    mr: 'उपहारगृह',
    bn: 'রেস্তোরাঁ',
    ta: 'உணவகம்',
    te: 'రెస్టారెంట్',
    gu: 'રેસ્ટોરન્ટ'
  },
  hotel: {
    en: 'Hotel',
    hi: 'होटल',
    mr: 'हॉटेल',
    bn: 'হোটেল',
    ta: 'விடுதி',
    te: 'హోటల్',
    gu: 'હોટેલ'
  },
  monument: {
    en: 'Monument',
    hi: 'स्मारक',
    mr: 'स्मारक',
    bn: 'স্মৃতিস্তম্ভ',
    ta: 'நினைவுச்சின்னம்',
    te: 'స్మారకం',
    gu: 'સ્મારક'
  },
  attraction: {
    en: 'Attraction',
    hi: 'पर्यटन आकर्षण',
    mr: 'पर्यटन आकर्षण',
    bn: 'পর্যটন আকর্ষণ',
    ta: 'சுற்றுலா ஈர்ப்பு',
    te: 'పర్యాటక ఆకర్షణ',
    gu: 'પ્રવાસન આકર્ષણ'
  }
};

export function getLocalizedCategory(cat: string = 'attraction', lang: string = 'en'): string {
  if (!cat) return CATEGORY_MAP['attraction']?.[lang] || 'Attraction';
  const normalized = cat.toLowerCase().trim();
  
  // Exact match
  if (CATEGORY_MAP[normalized]) {
    return CATEGORY_MAP[normalized]?.[lang] || CATEGORY_MAP[normalized]?.['en'] || cat;
  }
  
  // Substring matching
    if (normalized.includes('homestay') || normalized.includes('stay') || normalized.includes('cottage')) return CATEGORY_MAP['homestay']?.[lang] || 'Homestay';
  if (normalized.includes('restaurant') || normalized.includes('cafe') || normalized.includes('dining') || normalized.includes('bhojanalaya')) return CATEGORY_MAP['restaurant']?.[lang] || 'Restaurant';
  if (normalized.includes('hotel') || normalized.includes('resort') || normalized.includes('inn')) return CATEGORY_MAP['hotel']?.[lang] || 'Hotel';
  if (normalized.includes('monument')) return CATEGORY_MAP['monument']?.[lang] || 'Monument';
  if (normalized.includes('cultur') || normalized.includes('museum') || normalized.includes('memorial') || normalized.includes('gallery')) return CATEGORY_MAP['culture']?.[lang] || 'Culture';
  if (normalized.includes('spirit') || normalized.includes('relig') || normalized.includes('temple') || normalized.includes('mandir') || normalized.includes('gurudwara') || normalized.includes('church') || normalized.includes('mosque')) return CATEGORY_MAP['spiritual']?.[lang] || 'Spiritual';
  if (normalized.includes('herit') || normalized.includes('fort') || normalized.includes('palace') || normalized.includes('monument')) return CATEGORY_MAP['heritage']?.[lang] || 'Heritage';
  if (normalized.includes('natur') || normalized.includes('waterfall') || normalized.includes('lake') || normalized.includes('river') || normalized.includes('park') || normalized.includes('garden')) return CATEGORY_MAP['nature']?.[lang] || 'Nature';
  if (normalized.includes('mount') || normalized.includes('hill') || normalized.includes('peak') || normalized.includes('pass')) return CATEGORY_MAP['mountains']?.[lang] || 'Mountains';
  if (normalized.includes('beach') || normalized.includes('coast') || normalized.includes('island')) return CATEGORY_MAP['beaches']?.[lang] || 'Beaches';
  if (normalized.includes('wild') || normalized.includes('safari') || normalized.includes('sanctuary') || normalized.includes('zoo')) return CATEGORY_MAP['wildlife']?.[lang] || 'Wildlife';
  if (normalized.includes('advent') || normalized.includes('trek') || normalized.includes('climb') || normalized.includes('camp')) return CATEGORY_MAP['adventure']?.[lang] || 'Adventure';
  if (normalized.includes('shop') || normalized.includes('bazaar') || normalized.includes('bazar') || normalized.includes('market')) return CATEGORY_MAP['shopping']?.[lang] || 'Shopping';
  if (normalized.includes('food') || normalized.includes('cuisin') || normalized.includes('dhaba') || normalized.includes('culinar')) return CATEGORY_MAP['food']?.[lang] || 'Food';
  if (normalized.includes('rural') || normalized.includes('villag')) return CATEGORY_MAP['rural']?.[lang] || 'Rural';
  if (normalized.includes('well') || normalized.includes('yoga') || normalized.includes('ayurved')) return CATEGORY_MAP['wellness']?.[lang] || 'Wellness';

  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

/**
 * Translates or generates a culturally grounded, fluent destination summary in the target language.
 */
export function getLocalizedDestinationSummary(dest: DestinationMetadata, lang: string = 'en'): string {
  if (!dest) return '';
  const l = (lang || 'en').toLowerCase().trim();
  if (l === 'en') {
    return dest.summary || dest.description || dest.overview || 
      `${dest.name} is a renowned regional landmark in ${dest.state}. Celebrated for authentic regional heritage, architectural grandeur, and picturesque surroundings.`;
  }

  const name = dest.name || 'यह गंतव्य';
  const state = dest.state || 'भारत';
  const district = dest.district || dest.region || '';
  const locationStr = district && district !== state ? `${district}, ${state}` : state;
  const categoryLabel = getLocalizedCategory(dest.category, l);

  switch (l) {
    case 'hi':
      return `${name} ${locationStr} में स्थित एक प्रसिद्ध ${categoryLabel} है। यह गंतव्य प्रामाणिक क्षेत्रीय विरासत, वास्तुशिल्प सौंदर्य और सुरम्य प्राकृतिक दृश्यों के लिए दूर-दूर से पर्यटकों को आकर्षित करता है। यह इस क्षेत्र के सांस्कृतिक परिदृश्य और स्थानीय पर्यटन पहचान का एक अभिन्न अंग है।`;
    case 'mr':
      return `${name} हे ${locationStr} मधील एक नामांकित ${categoryLabel} आहे. अस्सल प्रादेशिक संस्कृती, ऐतिहासिक वास्तुकला आणि नयनरम्य निसर्गाचा अनुभव घेण्यासाठी प्रवासी येथे भेट देतात. हे ठिकाण या प्रांताच्या सांस्कृतिक परंपरेत आणि स्थानिक पर्यटनात अत्यंत महत्त्वाची भूमिका बजावते.`;
    case 'bn':
      return `${name} হল ${locationStr}-এর একটি অত্যন্ত প্রসিদ্ধ ${categoryLabel}। এই মনোরম স্থানটি খাঁটি আঞ্চলিক ঐতিহ্য, স্থাপত্যের সৌন্দর্য এবং নৈসর্গিক পরিবেশের জন্য বিশেষভাবে পরিচিত। এটি এই অঞ্চলের সাংস্কৃতিক পরিচিতি ও স্থানীয় পর্যটন বিকাশে গুরুত্বপূর্ণ ভূমিকা পালন করে।`;
    case 'ta':
      return `${name} என்பது ${locationStr} பகுதியில் அமைந்துள்ள ஒரு புகழ்பெற்ற ${categoryLabel} ஆகும். உண்மையான பிராந்திய பாரம்பரியம், கட்டடக்கலை கம்பீரம் மற்றும் இயற்கை எழில் கொஞ்சும் காட்சிகளை அனுபவிக்க பயணிகள் இங்கு வருகை தருகின்றனர். இது இப்பகுதியின் கலாச்சார மற்றும் சுற்றுலா அடையாளத்தில் முக்கிய இடம் வகிக்கிறது.`;
    case 'te':
      return `${name} అనేది ${locationStr}లో ఉన్న ఒక ప్రసిద్ధ ${categoryLabel} ప్రదేశం. ఇది ప్రామాణికమైన ప్రాంతీయ వారసత్వం, శిల్పకళా వైభవం మరియు కనువిందు చేసే సహజ సౌందర్యానికి ప్రసిద్ధి చెందింది. ఈ ప్రాంత సాంస్కృతిక విశిష్టత మరియు స్థానిక పర్యాటక రంగంలో ఇది కీలక పాత్ర పోషిస్తుంది.`;
    case 'gu':
      return `${name} એ ${locationStr} માં આવેલું એક સુપ્રસિદ્ધ ${categoryLabel} છે. અધિકૃત પ્રાદેશિક વારસો, સ્થાપત્યની ભવ્યતા અને મનોહર કુદરતી વાતાવરણ માણવા માટે પ્રવાસીઓ અહીં આવે છે. તે આ વિસ્તારના સાંસ્કૃતિક વારસા અને સ્થાનિક પ્રવાસન વિકાસમાં અનિવાર્ય ભૂમિકા ભજવે છે.`;
    default:
      return dest.summary || dest.description || `${dest.name} is a renowned landmark situated in ${dest.state}.`;
  }
}

/**
 * Translates the "Why TravelSathi Recommends" / Hidden Gem Reason
 */
export function getLocalizedHiddenGemReason(dest: DestinationMetadata, lang: string = 'en'): string {
  const l = (lang || 'en').toLowerCase().trim();
  if (l === 'en') {
    return dest.hiddenGemReason || 'Curated peaceful destination offering an untouched regional atmosphere away from overtourism.';
  }

  switch (l) {
    case 'hi':
      return 'अत्यधिक भीड़भाड़ (overtourism) से दूर, यह स्थल शांत वातावरण, स्वच्छ जैवविविधता और प्रामाणिक स्थानीय जनजातीय संस्कृति का संरक्षण करता है।';
    case 'mr':
      return 'व्यावसायिक गर्दीपासून दूर, हे ठिकाण शांत निसर्ग, समृद्ध जैवविविधता आणि स्थानिक संस्कृतीचा अस्सल अनुभव देते.';
    case 'bn':
      return 'অতিরিক্ত পর্যটন ভিড় এড়িয়ে এই স্থানটি প্রাকৃতিক প্রশান্তি, অনন্য জীববৈচিত্র্য এবং স্থানীয় গ্রামীণ সংস্কৃতির খাঁটি রূপ তুলে ধরে।';
    case 'ta':
      return 'அதிகப்படியான நெரிசல் இன்றி, அமைதியான இயற்கை சூழல், பல்லுயிர் வளம் மற்றும் உண்மையான உள்ளூர் கலாச்சாரத்தை அனுபவிக்க பரிந்துரைக்கப்படுகிறது.';
    case 'te':
      return 'రద్దీ లేని ప్రశాంతమైన వాతావరణం, పరిశుభ్రమైన జీవవైవిధ్యం మరియు ప్రామాణికమైన స్థానిక సంస్కృతిని అందించేందుకు ఇది సిఫార్సు చేయబడింది.';
    case 'gu':
      return 'વધુ પડતી ભીડથી દૂર, આ સ્થળ શાંત કુદરતી વાતાવરણ, સમૃદ્ધ જૈવવિવિધતા અને અધિકૃત સ્થાનિક સંસ્કૃતિની અનુભૂતિ કરાવે છે.';
    default:
      return 'Curated peaceful destination offering an untouched regional atmosphere away from overtourism.';
  }
}

/**
 * Translates Itinerary Summaries for the AI Planner in all 7 languages.
 */
export function getLocalizedItinerarySummary(itinerary: ItineraryMetadata, lang: string = 'en'): string {
  if (!itinerary) return '';
  const l = (lang || 'en').toLowerCase().trim();
  const destName = itinerary.destination || itinerary.state || 'India';
  const days = itinerary.days || 4;
  const isHP = destName.toLowerCase().includes('himachal') || destName.toLowerCase().includes('tirthan') || destName.toLowerCase().includes('kullu') || destName.toLowerCase().includes('manali');
  const isRajasthan = destName.toLowerCase().includes('rajasthan') || destName.toLowerCase().includes('jaipur') || destName.toLowerCase().includes('udaipur');
  const isKerala = destName.toLowerCase().includes('kerala') || destName.toLowerCase().includes('munnar') || destName.toLowerCase().includes('alleppey');

  if (l === 'en') {
    if (itinerary.summary) return itinerary.summary;
    if (isHP) return 'A mindful, uncrowded 4-day slow travel circuit through Great Himalayan National Park buffer zones, wood-and-stone Kathkuni hamlets, and organic trout farms.';
    if (isRajasthan) return "Explore Rajasthan's majestic pink stone ramparts, historic astronomical observatories, and artisan bazaars with zero-commission homestays.";
    if (isKerala) return 'Cruise palm-fringed lagoons on sustainable solar catamarans and experience centuries-old classical arts in heritage waterfront estates.';
    return `An authentic ${days}-day circuit in ${destName} prioritizing low-density heritage corridors, verified local homestays, and zero-commission community guiding.`;
  }

  if (isHP) {
    switch (l) {
      case 'hi':
        return 'ग्रेट हिमालयन नेशनल पार्क के बफर जोन, काष्ठ-कुणी पारंपरिक शैली के लकड़ी-पत्थर के गांवों और जैविक ट्राउट फार्मों के बीच एक शांत, गैर-व्यावसायिक ' + days + ' दिवसीय slow-travel यात्रा परिपथ।';
      case 'mr':
        return 'ग्रेट हिमालयन नॅशनल पार्क बफर झोन, लाकूड व दगडांच्या काष्ठकुणी वास्तुकलेची गावे आणि सेंद्रिय ट्राउट फार्म्समधून जाणारा ' + days + ' दिवसांचा शांत व निसर्गरम्य प्रवास मार्ग.';
      case 'bn':
        return 'গ্রেট হিমালয়ান ন্যাশনাল পার্ক বাফার জোন, কাঠের ঐতিহ্যবাহী কাঠকুনি গ্রাম এবং প্রাকৃতিক ট্রাউট ফার্মের মধ্য দিয়ে ' + days + ' দিনের এক শান্তিময় slow-travel ভ্রমণ সার্কিট।';
      case 'ta':
        return 'கிரேட் ஹிமாலயன் தேசிய பூங்கா மண்டலங்கள், மர-கற்கள் கொண்ட பாரம்பரிய கிராமங்கள் மற்றும் இயற்கை பண்ணைகள் வழியாக ' + days + ' நாள் அமைதியான சுற்றுலாப் பயணம்.';
      case 'te':
        return 'గ్రేట్ హిమాలయన్ నేషనల్ పార్క్ బఫర్ జోన్లు, సాంప్రదాయ చెక్క ఇళ్ల గ్రామాలు మరియు సహజ నదుల గుండా సాగే ' + days + ' రోజుల ప్రశాంతమైన పర్యాటక మార్గం.';
      case 'gu':
        return 'ગ્રેટ હિમાલયન નેશનલ પાર્ક બફર ઝોન, પરંપરાગત કાષ્ઠકુની લાકડાના મકાનો ધરાવતા ગામો અને સુંદર નદીઓ વચ્ચે ' + days + ' દિવસનો શાંતિપૂર્ણ પ્રવાસ માર્ગ.';
    }
  }

  if (isRajasthan) {
    switch (l) {
      case 'hi':
        return 'राजस्थान के भव्य गुलाबी पत्थरों के दुर्गों, ऐतिहासिक खगोलीय वेधशालाओं और हस्तशिल्प बाजारों की शून्य-कमीशन प्रमाणित होमस्टे के साथ ' + days + ' दिवसीय सांस्कृतिक यात्रा।';
      case 'mr':
        return 'राजस्थानचे भव्य गुलाबी दगडी किल्ले, ऐतिहासिक खगोल वेधशाळा आणि हस्तकला बाजारांची शून्य-कमिशन होमस्टेसह ' + days + ' दिवसांची सांस्कृतिक सफर.';
      case 'bn':
        return 'রাজস্থানের রাজকীয় দুর্গ, প্রাচীন জ্যোতির্বিজ্ঞান মানমন্দির এবং স্থানীয় কারুশিল্পের বাজারের ' + days + ' দিনের রোমাঞ্চকর ঐতিহ্যবাহী ভ্রমণ।';
      case 'ta':
        return 'ராஜஸ்தானின் பிரம்மாண்ட கோட்டைகள், வரலாற்று சிறப்புமிக்க வானியல் ஆய்வகங்கள் மற்றும் கைவினைப் பொருட்கள் சந்தைகளை உள்ளடக்கிய ' + days + ' நாள் பாரம்பரிய பயணம்.';
      case 'te':
        return 'రాజస్థాన్ చారిత్రక కోటలు, ప్రాచీన ఖగోళ వేధశాలలు మరియు స్థానిక హస్తకళల మార్కెట్లను సందర్శించే ' + days + ' రోజుల సాంస్కృతిక యాత్ర.';
      case 'gu':
        return 'રાજસ્થાનના ભવ્ય ઐતિહાસિક કિલ્લાઓ, ખગોળ વેધશાળાઓ અને સ્થાનિક હસ્તકળા બજારોની ' + days + ' દિવસીય સાંસ્કૃતિક સફર.';
    }
  }

  if (isKerala) {
    switch (l) {
      case 'hi':
        return 'केरल के शांत बैकवाटर्स, पर्यावरण-अनुकूल सौर शिकारा और सदियों पुरानी शास्त्रीय कलाओं के साथ तटीय संपदा में ' + days + ' दिवसीय शांत विश्राम।';
      case 'mr':
        return 'केरळचे हिरवेगार बॅकवाटर्स, सौर ऊर्जेवर चालणाऱ्या बोटी आणि शतकानुशतके जुनी शास्त्रीय कला अनुभवण्याचा ' + days + ' दिवसांचा निसर्गरम्य प्रवास.';
      case 'bn':
        return 'কেরালার শান্ত ব্যাকওয়াটার, পরিবেশবান্ধব সৌর নৌকা এবং ঐতিহ্যবাহী পরিবেশের মধ্য দিয়ে ' + days + ' দিনের স্নিগ্ধ উপকূলীয় ভ্রমণ।';
      case 'ta':
        return 'கேரளாவின் இயற்கை எழில் கொஞ்சும் காயல்கள் மற்றும் பாரம்பரிய கலைகளை அனுபவிக்கும் ' + days + ' நாள் பசுமை சுற்றுலாப் பயணம்.';
      case 'te':
        return 'కేరళ బ్యాక్‌వాటర్స్, పర్యావరణ అనుకూల పడవ ప్రయాణాలు మరియు సంప్రదాయ కళలను ఆస్వాదించే ' + days + ' రోజుల ప్రశాంత తీరప్రాంత యాత్ర.';
      case 'gu':
        return 'કેરળના શાંત જળાશયો, ઇકો-ફ્રેન્ડલી બોટ સફર અને સમૃદ્ધ સંસ્કૃતિનો અનુભવ કરાવતો ' + days + ' દિવસીય મનોહર પ્રવાસ.';
    }
  }

  // Generic circuit fallback
  switch (l) {
    case 'hi':
      return `${destName} के कम भीड़भाड़ वाले विरासत गलियारों, प्रमाणित स्थानीय होमस्टे और शून्य-कमीशन सामुदायिक टूर गाइडों के साथ एक प्रामाणिक ${days} दिवसीय यात्रा परिपथ।`;
    case 'mr':
      return `${destName} मधील कमी गर्दीचे ऐतिहासिक वारसा मार्ग, प्रमाणित स्थानिक होमस्टे आणि विना-कमिशन मार्गदर्शकांसह अस्सल ${days} दिवसांचा प्रवास मार्ग.`;
    case 'bn':
      return `${destName}-এর কম জনাকীর্ণ ঐতিহ্যবাহী পথ, প্রত্যয়িত স্থানীয় হোমস্টে এবং জিরো-কমিশন কমিউনিটি গাইডের সমন্বয়ে একটি খাঁটি ${days} দিনের ভ্রমণ সার্কিট।`;
    case 'ta':
      return `${destName} பகுதியின் குறைந்த நெரிசல் கொண்ட பாரம்பரிய இடங்கள் மற்றும் சான்றளிக்கப்பட்ட தங்குமிடங்களுடன் கூடிய ${days} நாள் பயணம்.`;
    case 'te':
      return `${destName}లోని తక్కువ రద్దీ గల చారిత్రక మార్గాలు మరియు ధృవీకరించబడిన హోమ్‌స్టేలతో కూడిన ${days} రోజుల ప్రామాణిక ప్రయాణ మార్గం.`;
    case 'gu':
      return `${destName} ના ઓછા ભીડવાળા ઐતિહાસિક વારસાના માર્ગો અને પ્રમાણિત હોમસ્ટે સાથેનો અધિકૃત ${days} દિવસીય પ્રવાસ માર્ગ.`;
    default:
      return `An authentic ${days}-day circuit in ${destName} prioritizing low-density corridors and verified homestays.`;
  }
}

/**
 * Universal phrase & sentence dictionary for TravelSathi
 */
const PHRASE_DICTIONARY: Record<string, Record<string, string>> = {
  // Safety Advisories
  "Smooth GT Road (NH-44) Highway Patrol & City Transit Clearance": {
    hi: "सुगम जीटी रोड (एनएच-44) हाईवे गश्त एवं नगर पारगमन निकासी",
    mr: "सुलभ जीटी रोड (एनएच-44) महामार्ग गस्त व शहर वाहतूक सुरळीत",
    bn: "সহজ জিটি রোড (এনএইচ-৪৪) হাইওয়ে টহল ও নগর ট্রানজিট স্বাভাবিক",
    ta: "சுமுகமான ஜிடி சாலை (NH-44) நெடுஞ்சாலை ரோந்து & நகர போக்குவரத்து சீரமைப்பு",
    te: "సులభతర జీటీ రోడ్డు (NH-44) హైవే పెట్రోలింగ్ & నగర రవాణా క్లియరెన్స్",
    gu: "સુગમ જીટી રોડ (NH-44) હાઇવે પેટ્રોલિંગ અને શહેર પરિવહન સરળ"
  },
  "High-traffic expressway flow stable with 24/7 PCR highway interceptors active. City heritage areas and bus terminals operating with standard night safety patrols. Clear visibility recorded.": {
    hi: "24/7 पीसीआर हाईवे इंटरसेप्टर सक्रिय होने से एक्सप्रेसवे यातायात सुचारू है। शहरी विरासत क्षेत्रों और बस टर्मिनलों में मानक सुरक्षा गश्त जारी है। दृश्यता सामान्य दर्ज की गई।",
    mr: "24/7 पीसीआर महामार्ग पथके तैनात असल्याने एक्सप्रेसवे वाहतूक सुरळीत आहे. शहरातील ऐतिहासिक भाग आणि बस स्थानकांवर नियमित सुरक्षा गस्त सुरू आहे. दृश्यमानता उत्तम आहे.",
    bn: "২৪/৭ পিসিআর হাইওয়ে ইন্টারসেপ্টর সক্রিয় থাকায় এক্সপ্রেসওয়ে ট্রাফিক স্বাভাবিক। শহরের ঐতিহ্যবাহী এলাকা ও বাস টার্মিনালে নিয়মিত টহল চলছে। দৃশ্যমানতা পরিষ্কার।",
    ta: "24/7 பிசிஆர் நெடுஞ்சாலை ரோந்து செயல்படுவதால் விரைவுச்சாலை போக்குவரத்து சீராக உள்ளது. நகரின் பாரம்பரிய பகுதிகள் மற்றும் பேருந்து நிலையங்களில் இரவு ரோந்து இயங்குகிறது. தெளிவான பார்வை பதிவாகியுள்ளது.",
    te: "24/7 పీసీఆర్ హైవే వాహనాలు యాక్టివ్‌గా ఉండటంతో ఎక్స్‌ప్రెస్‌వే ట్రాఫిక్ సాఫీగా సాగుతోంది. నగర వారసత్వ ప్రదేశాలు మరియు బస్ టెర్మినల్స్‌లో సాధారణ భద్రతా పెట్రోలింగ్ కొనసాగుతోంది. దృశ్యత సాధారణంగా ఉంది.",
    gu: "24/7 પીસીઆર હાઇવે ઇન્ટરસેપ્ટર્સ સક્રિય હોવાથી એક્સપ્રેસવે ટ્રાફિક વ્યવસ્થિત છે. શહેરના ઐતિહાસિક વિસ્તારો અને બસ ટર્મિનલ્સમાં સુરક્ષા પેટ્રોલિંગ ચાલુ છે. દૃશ્યતા સામાન્ય નોંધાઈ છે."
  },
  "Smooth Evening Beating Retreat Transit & Golden Temple Walkway Active": {
    hi: "सुगम संध्या बीटिंग रिट्रीट पारगमन एवं स्वर्ण मंदिर पैदल मार्ग सक्रिय",
    mr: "संध्याकाळची बीटिंग रिट्रीट वाहतूक सुरळीत व सुवर्ण मंदिर पदपथ खुला",
    bn: "সন্ধ্যার বিটিং রিট্রিট ট্রানজিট স্বাভাবিক ও স্বর্ণ মন্দির হাঁটা পথ সক্রিয়",
    ta: "சுமுகமான மாலை பீட்டிங் ரிட்ரீட் போக்குவரத்து & பொற்கோவில் நடைபாதை இயங்குகிறது",
    te: "సాయంత్రపు బీటింగ్ రిట్రీట్ రవాణా సాఫీ & స్వర్ణ దేవాలయ వాక్‌వే యాక్టివ్",
    gu: "સાંજની બીટીંગ રીટ્રીટ અવરજવર સરળ અને સુવર્ણ મંદિર પદયાત્રા માર્ગ સક્રિય"
  },
  "Golden Temple heritage corridor and Wagah Border ceremonial plaza operating with dedicated tourist police marshals. Free luggage cloakrooms available at Amritsar Central. Mild evening breeze (23°C).": {
    hi: "स्वर्ण मंदिर हेरिटेज कॉरिडोर और वाघा बॉर्डर सेरेमोनियल प्लाजा में समर्पित पर्यटक पुलिस तैनात है। अमृतसर सेंट्रल में निःशुल्क क्लॉक रूम उपलब्ध। शाम की सुखद हवा (23°C)।",
    mr: "सुवर्ण मंदिर वारसा कॉरिडॉर आणि वाघा बॉर्डर प्लाझा येथे विशेष पर्यटक पोलीस तैनात आहेत. अमृतसर सेंट्रल येथे मोफत सामान कक्ष उपलब्ध. सुखद संध्याकाळचे वारे (23°C).",
    bn: "স্বর্ণ মন্দির ঐতিহ্যবাহী করিডোর এবং ওয়াঘা সীমান্ত প্লাজায় পর্যটক পুলিশ মোতায়েন রয়েছে। অমৃতসর সেন্ট্রালে বিনামূল্যে লাগেজ ক্লকরুম উপলব্ধ। মনোরম সন্ধ্যার আবহাওয়া (২৩°C)।",
    ta: "பொற்கோவில் பாரம்பரிய பாதை மற்றும் வாகா எல்லை விழா பகுதியில் சுற்றுலா காவலர்கள் உள்ளனர். அமிர்தசரஸ் சென்ட்ரலில் இலவச லக்கேஜ் அறை உள்ளது. இனிமையான மாலைக் காற்று (23°C).",
    te: "స్వర్ణ దేవాలయ హెరిటేజ్ కారిడార్ మరియు వాఘా సరిహద్దు ప్లాజా వద్ద టూరిస్ట్ పోలీసులు ఉన్నారు. అమృత్‌సర్ సెంట్రల్‌లో ఉచిత లగేజ్ క్లాక్‌రూమ్ అందుబాటులో ఉంది. ఆహ్లాదకరమైన సాయంత్రం (23°C).",
    gu: "સુવર્ણ મંદિર હેરિટેજ કોરિડોર અને વાઘા બોર્ડર પ્લાઝા ખાતે ખાસ ટૂરિસ્ટ પોલીસ તહેનાત છે. અમૃતસર સેન્ટ્રલ પર મફત લગેજ ક્લોકરૂમ ઉપલબ્ધ. ખુશનુમા સાંજ (23°C)."
  },

  // Cultural Event Modal terms (Image 1)
  "Pondicherry Heritage Festival": {
    hi: "पांडिचेरी हेरिटेज फेस्टिवल",
    mr: "पाँडिचेरी हेरिटेज फेस्टिव्हल",
    bn: "পন্ডিচেরি হেরিটেজ ফেস্টিভ্যাল",
    ta: "பாண்டிச்சேரி பாரம்பரிய திருவிழா",
    te: "పాండిచ్చేరి హెరిటేజ్ ఫెస్టివల్",
    gu: "પોંડિચેરી હેરિટેજ ફેસ્ટિવલ"
  },
  "Pondicherry Heritage Festival of Puducherry": {
    hi: "पुडुचेरी का पांडिचेरी हेरिटेज उत्सव",
    mr: "पुडुचेरीचा पाँडिचेरी हेरिटेज उत्सव",
    bn: "পুদুচেরির পন্ডিচেরি ঐতিহ্য উৎসব",
    ta: "புதுச்சேரியின் பாண்டிச்சேரி பாரம்பரிய திருவிழா",
    te: "పుదుచ్చేరి యొక్క పాండిచ్చేరి హెరిటేజ్ ఉత్సవం",
    gu: "પુડુચેરીનો પોંડિચેરી હેરિટેજ ઉત્સવ"
  },
  "Pondicherry Heritage Festival brings together artists, communities, and pilgrims in Puducherry. Celebrated with traditional music, native rituals, and local crafts.": {
    hi: "पांडिचेरी हेरिटेज फेस्टिवल पुडुचेरी में कलाकारों, स्थानीय समुदायों और पर्यटकों को एक साथ लाता है। यह पारंपरिक संगीत, सांस्कृतिक अनुष्ठानों और स्थानीय शिल्पकला के साथ हर्षोल्लास से मनाया जाता है।",
    mr: "पाँडिचेरी हेरिटेज फेस्टिव्हल पुडुचेरीमधील कलाकार, स्थानिक समुदाय आणि पर्यटकांना एकत्र आणतो. पारंपरिक संगीत, स्थानिक विधी आणि हस्तकलेच्या प्रदर्शनासह हा उत्सव साजरा केला जातो.",
    bn: "পন্ডিচেরি হেরিটেজ ফেস্টিভ্যাল পুদুচেরির শিল্পী, স্থানীয় সম্প্রদায় এবং দর্শকদের একত্রিত করে। ঐতিহ্যবাহী সঙ্গীত, আঞ্চলিক আচার এবং স্থানীয় কারুশিল্পের সাথে এটি উদযাপিত হয়।",
    ta: "பாண்டிச்சேரி பாரம்பரிய திருவிழா புதுச்சேரியில் கலைஞர்கள், உள்ளூர் மக்கள் மற்றும் பார்வையாளர்களை ஒன்றிணைக்கிறது. பாரம்பரிய இசை, சடங்குகள் மற்றும் கைவினைப் பொருட்களுடன் இது கொண்டாடப்படுகிறது.",
    te: "పాండిచ్చేరి హెరిటేజ్ ఫెస్టివల్ పుదుచ్చేరిలోని కళాకారులు, స్థానిక ప్రజలు మరియు పర్యాటకులను ఒకచోట చేర్చుతుంది. సాంప్రదాయ సంగీతం, స్థానిక ఆచారాలు మరియు హస్తకళలతో ఇది జరుపుకోబడుతుంది.",
    gu: "પોંડિચેરી હેરિટેજ ફેસ્ટિવલ પુડુચેરીમાં કલાકારો, સમુદાયો અને પ્રવાસીઓને એકઠા કરે છે. પરંપરાગત સંગીત, મૂળ ધાર્મિક વિધિઓ અને સ્થાનિક હસ્તકલા સાથે આ ઉત્સવ ઉજવાય છે."
  },
  "Integral part of Puducherry's regional folklore and heritage calendar.": {
    hi: "पुडुचेरी की क्षेत्रीय लोकसंस्कृति, ऐतिहासिक परंपराओं और वार्षिक उत्सव कैलेंडर का एक अभिन्न अंग।",
    mr: "पुडुचेरीच्या प्रादेशिक लोकसंस्कृती आणि वार्षिक सांस्कृतिक दिनदर्शिकेचा अविभाज्य भाग.",
    bn: "পুদুচেরির আঞ্চলিক লোকসংস্কৃতি এবং ঐতিহ্যবাহী ক্যালেন্ডারের একটি অবিচ্ছেদ্য অংশ।",
    ta: "புதுச்சேரியின் பிராந்திய நாட்டுப்புற கலாச்சாரம் மற்றும் பாரம்பரிய நாள்காட்டியின் முக்கிய அங்கம்.",
    te: "పుదుచ్చేరి ప్రాంతీయ జానపద కళలు మరియు వార్షిక సాంస్కృతిక క్యాలెండర్‌లో ఇది ఒక ముఖ్యమైన భాగం.",
    gu: "પુડુચેરીની પ્રાદેશિક લોકસાહિત્ય અને વાર્ષિક સાંસ્કૃતિક કેલેન્ડરનો અવિભાજ્ય ભાગ."
  },
  "Showcases traditional performing arts, culinary specialties, and artisan traditions of Puducherry.": {
    hi: "पुडुचेरी की पारंपरिक प्रदर्शन कलाओं, प्रामाणिक स्थानीय व्यंजनों और पारंपरिक शिल्प परंपराओं को प्रदर्शित करता है।",
    mr: "पुडुचेरीच्या पारंपरिक कला, स्थानिक खाद्यसंस्कृती आणि हस्तकला कारागिरांच्या कौशल्याचे दर्शन घडवतो.",
    bn: "পুদুচেরির ঐতিহ্যবাহী পরিবেশন কলা, রন্ধনশৈলী এবং কারিগরদের ঐতিহ্য প্রদর্শন করে।",
    ta: "புதுச்சேரியின் பாரம்பரிய கலைகள், சமையல் சிறப்புகள் மற்றும் கைவினை மரபுகளை காட்சிப்படுத்துகிறது.",
    te: "పుదుచ్చేరి యొక్క సాంప్రదాయ ప్రదర్శన కళలు, ఆహార వంటకాలు మరియు చేతివృత్తుల సంప్రదాయాలను ప్రదర్శిస్తుంది.",
    gu: "પુડુચેરીની પરંપરાગત પ્રદર્શન કલાઓ, સ્થાનિક વાનગીઓ અને કારીગરોની પરંપરાઓ દર્શાવે છે."
  },

  // Experience marketplace titles (Image 3)
  "Spiti 1000-Year Monastery & Marine Fossil Walk": {
    hi: "स्पीति 1000-वर्षीय मठ एवं समुद्री जीवाश्म हेरिटेज वॉक",
    mr: "स्पीती 1000 वर्षे जुने बौद्ध मठ व सागरी जीवाश्म सफर",
    bn: "স্পিতি ১০০০ বছরের মনাস্ট্রি ও সামুদ্রিক জীবাশ্ম ওয়াক",
    ta: "ஸ்பிதி 1000 ஆண்டு பழமையான மடாலயம் & புதைபடிவ நடைபயணம்",
    te: "స్పితి 1000 సంవత్సరాల మఠం & సముద్ర శిలాజాల నడక",
    gu: "સ્પિતી 1000-વર્ષ જૂનો મઠ અને દરિયાઇ અશ્મિ વૉક"
  },
  "Sacred Ganga Ghats & Ayurvedic Herb Walk": {
    hi: "पवित्र गंगा घाट एवं आयुर्वेदिक औषधि हेरिटेज वॉक",
    mr: "पवित्र गंगा घाट व आयुर्वेदिक वनस्पती सफर",
    bn: "পবিত্র গঙ্গা ঘাট ও আয়ুর্বেদিক ভেষজ ওয়াক",
    ta: "புனித கங்கை படித்துறை & ஆயுர்வேத மூலிகை நடைபயணம்",
    te: "పవిత్ర గంగా ఘాట్లు & ఆయుర్వేద మూలికల నడక",
    gu: "પવિત્ર ગંગા ઘાટ અને આયુર્વેદિક વનસ્પતિ વૉક"
  },
  "Old Jaipur Havelis & Hand-Block Print Masterclass": {
    hi: "पुरातन जयपुर हवेलियां एवं हस्त-ब्लॉक प्रिंट मास्टरक्लास",
    mr: "जुनी जयपूर हवेली व हँड-ब्लॉक प्रिंटिंग कार्यशाळा",
    bn: "পুরনো জয়পুর হাভেলি ও হ্যান্ড-ব্লক প্রিন্ট মাস্টারক্লাস",
    ta: "பழைய ஜெய்ப்பூர் மாளிகைகள் & பாரம்பரிய அச்சுக்கலை பயிற்சி",
    te: "పాత జైపూర్ హవేలీలు & చేతి-బ్లాక్ ప్రింటింగ్ శిక్షణ",
    gu: "પુરાતન જયપુર હવેલીઓ અને હેન્ડ-બ્લોક પ્રિન્ટ માસ્ટરક્લાસ"
  },
  "High Altitude Tribal Trail": {
    hi: "उच्च पर्वतीय जनजातीय मार्ग",
    mr: "उंच पर्वतीय आदिवासी मार्ग",
    bn: "উচ্চ পার্বত্য উপজাতীয় পথ",
    ta: "உயரமான மலைவாழ் பழங்குடி பாதை",
    te: "ఎత్తైన పర్వత గిరిజన మార్గం",
    gu: "ઉચ્ચ પર્વતીય આદિવાસી માર્ગ"
  },
  "Vedic Wellness Certified": {
    hi: "वैदिक स्वास्थ्य प्रमाणित",
    mr: "वैदिक आरोग्य प्रमाणित",
    bn: "বৈদিক সুস্থতা প্রত্যয়িত",
    ta: "வேத ஆரோக்கிய சான்றிதழ்",
    te: "వైదిక ఆరోగ్య ధృవీకృతం",
    gu: "વૈદિક સ્વાસ્થ્ય પ્રમાણિત"
  },
  "Govt Certified Heritage Scout": {
    hi: "सरकारी प्रमाणित हेरिटेज स्काउट",
    mr: "शासकीय प्रमाणित वारसा मार्गदर्शक",
    bn: "সরকারি প্রত্যয়িত ঐতিহ্য স্কাউট",
    ta: "அரசு சான்றளிக்கப்பட்ட பாரம்பரிய வழிகாட்டி",
    te: "ప్రభుత్వ ధృవీకృత వారసత్వ గైడ్",
    gu: "સરકારી પ્રમાણિત હેરિટેજ સ્કાઉટ"
  },

  // Helplines
  "National Emergency Service": {
    hi: "राष्ट्रीय आपातकालीन सेवा",
    mr: "राष्ट्रीय आणीबाणी सेवा",
    bn: "জাতীয় জরুরি সেবা",
    ta: "தேசிய அவசர சேவை",
    te: "జాతీయ అత్యవసర సేవ",
    gu: "રાષ્ટ્રીય કટોકટી સેવા"
  },
  "Single unified number for Police, Fire, and Ambulance nationwide": {
    hi: "पुलिस, अग्निशमन और एम्बुलेंस के लिए देशव्यापी एकल एकीकृत नंबर",
    mr: "पोलीस, अग्निशामक आणि रुग्णवाहिकेसाठी देशव्यापी एकच क्रमांक",
    bn: "পুলিশ, ফায়ার এবং অ্যাম্বুলেন্সের জন্য দেশব্যাপী একক নম্বর",
    ta: "நாடு முழுவதும் காவல், தீயணைப்பு மற்றும் ஆம்புலன்ஸிற்கான ஒற்றை எண்",
    te: "పోలీస్, ఫైర్ మరియు అంబులెన్స్ కోసం దేశవ్యాప్త ఉమ్మడి నంబర్",
    gu: "પોલીસ, ફાયર અને એમ્બ્યુલન્સ માટે દેશવ્યાપી સિંગલ નંબર"
  },
  "Tourist Police Helpline": {
    hi: "पर्यटक पुलिस हेल्पलाइन",
    mr: "पर्यटक पोलीस हेल्पलाइन",
    bn: "ট্যুরিস্ট পুলিশ হেল্পলাইন",
    ta: "சுற்றுலா காவல் உதவி எண்",
    te: "పర్యాటక పోలీస్ హెల్ప్‌లైన్",
    gu: "ટૂરિસ્ટ પોલીસ હેલ્પલાઇન"
  },
  "24/7 Multi-lingual Ministry of Tourism assistance": {
    hi: "पर्यटन मंत्रालय की 24/7 बहुभाषी सहायता",
    mr: "पर्यटन मंत्रालयाचे 24/7 बहुभाषिक सहाय्य",
    bn: "পর্যটন মন্ত্রণালয়ের 24/7 বহুভাষিক সহায়তা",
    ta: "சுற்றுலா அமைச்சகத்தின் 24/7 பலமொழி உதவி",
    te: "పర్యాటక మంత్రిత్వ శాఖ 24/7 బహుభాషా సహాయం",
    gu: "પ્રવાસન મંત્રાલયની 24/7 બહુભાષી સહાય"
  },
  "Women Safety Helpline": {
    hi: "महिला सुरक्षा हेल्पलाइन",
    mr: "महिला सुरक्षा हेल्पलाइन",
    bn: "মহিলা নিরাপত্তা হেল্পলাইন",
    ta: "பெண்கள் பாதுகாப்பு உதவி எண்",
    te: "మహిళా భద్రత హెల్ప్‌లైన్",
    gu: "મહિલા સુરક્ષા હેલ્પલાઇન"
  },
  "Direct 24/7 rapid response for solo women travelers": {
    hi: "एकल महिला यात्रियों के लिए 24/7 त्वरित प्रतिक्रिया सेवा",
    mr: "एकट्या प्रवास करणाऱ्या महिलांसाठी 24/7 तत्पर मदत",
    bn: "একক নারী ভ্রমণকারীদের জন্য 24/7 দ্রুত প্রতিক্রিয়া",
    ta: "தனியாகப் பயணிக்கும் பெண்களுக்கான 24/7 உடனடி உதவி",
    te: "ఒంటరిగా ప్రయాణించే మహిళల కోసం 24/7 తక్షణ స్పందన",
    gu: "એકલ મહિલા પ્રવાસીઓ માટે 24/7 ત્વરિત સહાય"
  },
  "Highway Emergency Support": {
    hi: "राजमार्ग आपातकालीन सहायता",
    mr: "महामार्ग आणीबाणी मदत",
    bn: "হাইওয়ে জরুরি সহায়তা",
    ta: "நெடுஞ்சாலை அவசர உதவி",
    te: "హైవే అత్యవసర సహాయం",
    gu: "હાઇવે કટોકટી સહાય"
  },
  "National Highways Authority of India (NHAI) road assistance": {
    hi: "भारतीय राष्ट्रीय राजमार्ग प्राधिकरण (NHAI) सड़क सहायता",
    mr: "भारतीय राष्ट्रीय महामार्ग प्राधिकरण (NHAI) रस्ता मदत",
    bn: "ভারতীয় জাতীয় সড়ক কর্তৃপক্ষ (NHAI) সহায়তা",
    ta: "இந்திய தேசிய நெடுஞ்சாலைகள் ஆணைய (NHAI) உதவி",
    te: "భారత జాతీయ రహదారుల సంస్థ (NHAI) సహాయం",
    gu: "ભારતીય રાષ્ટ્રીય ધોરીમાર્ગ પ્રાધિકરણ (NHAI) સહાય"
  },
  "Disaster Management (NDRF)": {
    hi: "आपदा प्रबंधन (NDRF)",
    mr: "आपत्ती व्यवस्थापन (NDRF)",
    bn: "দুর্যোগ ব্যবস্থাপনা (NDRF)",
    ta: "பேரிடர் மேலாண்மை (NDRF)",
    te: "విపత్తు నిర్వహణ (NDRF)",
    gu: "આપત્તિ વ્યવસ્થાપન (NDRF)"
  },
  "National Disaster Response Force emergency command": {
    hi: "राष्ट्रीय आपदा प्रतिक्रिया बल आपातकालीन कमांड",
    mr: "राष्ट्रीय आपत्ती प्रतिसाद दल नियंत्रण कक्ष",
    bn: "জাতীয় দুর্যোগ মোকাবিলা বাহিনী জরুরি নিয়ন্ত্রণ",
    ta: "தேசிய பேரிடர் மீட்புப் படை அவசர கட்டுப்பாட்டு மையம்",
    te: "జాతీయ విపత్తు ప్రతిస్పందన దళం అత్యవసర కమాండ్",
    gu: "રાષ્ટ્રીય આપત્તિ વ્યવસ્થાપન દળ કટોકટી કમાન્ડ"
  },

  // Additional safety, location and advisory terms
  "Historic Grounds / Central Venue, Puducherry, Puducherry": {
    hi: "ऐतिहासिक मैदान / मुख्य स्थल, पुडुचेरी, पुडुचेरी",
    mr: "ऐतिहासिक मैदान / मध्यवर्ती ठिकाण, पुडुचेरी, पुडुचेरी",
    bn: "ঐতিহাসিক মাঠ / প্রধান ভেন্যু, পুদুচেরি, পুদুচেরি",
    ta: "வரலாற்று மைதானம் / மத்திய அரங்கம், புதுச்சேரி, புதுச்சேரி",
    te: "చారిత్రక మైదానం / కేంద్ర వేదిక, పుదుచ్చేరి, పుదుచ్చేరి",
    gu: "ઐતિહાસિક મેદાન / મુખ્ય સ્થળ, પુડુચેરી, પુડુચેરી"
  },
  "Historic Grounds / Central Venue, Puducherry": {
    hi: "ऐतिहासिक मैदान / मुख्य स्थल, पुडुचेरी",
    mr: "ऐतिहासिक मैदान / मध्यवर्ती ठिकाण, पुडुचेरी",
    bn: "ঐতিহাসিক মাঠ / প্রধান ভেন্যু, পুদুচেরি",
    ta: "வரலாற்று மைதானம் / மத்திய அரங்கம், புதுச்சேரி",
    te: "చారిత్రక మైదానం / కేంద్ర వేదిక, పుదుచ్చేరి",
    gu: "ઐતિહાસિક મેદાન / મુખ્ય સ્થળ, પુડુચેરી"
  },
  "Puducherry, Puducherry": {
    hi: "पुडुचेरी, पुडुचेरी",
    mr: "पुडुचेरी, पुडुचेरी",
    bn: "পুদুচেরি, পুদুচেরি",
    ta: "புதுச்சேரி, புதுச்சேரி",
    te: "పుదుచ్చేరి, పుదుచ్చేరి",
    gu: "પુડુચેરી, પુડુચેરી"
  },
  "Punjab (Jalandhar & Phagwara Corridor)": {
    hi: "पंजाब (जालंधर एवं फगवाड़ा कॉरिडोर)",
    mr: "पंजाब (जालंधर व फगवाडा कॉरिडॉर)",
    bn: "পাঞ্জাব (জলন্ধর ও ফাগওয়ারা করিডোর)",
    ta: "பஞ்சாப் (ஜலந்தர் & ஃபக்வாரா காரிடார்)",
    te: "పంజాబ్ (జలంధర్ & ఫగ్వారా కారిడార్)",
    gu: "પંજાબ (જલંધર અને ફગવાડા કોરિડોર)"
  },
  "Punjab (Amritsar & Wagah Border)": {
    hi: "पंजाब (अमृतसर एवं वाघा बॉर्डर)",
    mr: "पंजाब (अमृतसर व वाघा बॉर्डर)",
    bn: "পাঞ্জাব (অমৃতসর ও ওয়াঘা সীমান্ত)",
    ta: "பஞ்சாப் (அமிர்தசரஸ் & வாகா எல்லை)",
    te: "పంజాబ్ (అమృతసర్ & వాఘా సరిహద్దు)",
    gu: "પંજાબ (અમૃતસર અને વાઘા બોર્ડર)"
  },
  "Civil Hospital Phagwara (Emergency Unit)": {
    hi: "सिविल अस्पताल फगवाड़ा (आपातकालीन इकाई)",
    mr: "सिव्हिल हॉस्पिटल फगवाडा (आणीबाणी विभाग)",
    bn: "সিভিল হাসপাতাল ফাগওয়ারা (জরুরি ইউনিট)",
    ta: "சிவில் மருத்துவமனை ஃபக்வாரா (அவசர பிரிவு)",
    te: "సివిల్ హాస్పిటల్ ఫగ్వారా (అత్యవసర విభాగం)",
    gu: "સિવિલ હોસ્પિટલ ફગવાડા (કટોકટી વિભાગ)"
  },
  "Punjab Police Tourist Assistance Wing": {
    hi: "पंजाब पुलिस पर्यटक सहायता विंग",
    mr: "पंजाब पोलीस पर्यटक सहाय्यता कक्ष",
    bn: "পাঞ্জাব পুলিশ ট্যুরিস্ট অ্যাসিস্ট্যান্স উইং",
    ta: "பஞ்சாப் காவல் சுற்றுலா உதவிப் பிரிவு",
    te: "పంజాబ్ పోలీస్ టూరిస్ట్ సహాయ విభాగం",
    gu: "પંજાબ પોલીસ પ્રવાસી સહાયતા વિંગ"
  },
  "G.T. Road, Phagwara, Punjab": {
    hi: "जी.टी. रोड, फगवाड़ा, पंजाब",
    mr: "जी.टी. रोड, फगवाडा, पंजाब",
    bn: "জি.টি. রোড, ফাগওয়ারা, পাঞ্জাব",
    ta: "ஜி.டி. சாலை, ஃபக்வாரா, பஞ்சாப்",
    te: "జి.టి. రోడ్డు, ఫగ్వారా, పంజాబ్",
    gu: "જી.ટી. રોડ, ફગવાડા, પંજાબ"
  },
  "NH-44 Corridor, Phagwara & Jalandhar Sub-Division": {
    hi: "एनएच-44 कॉरिडोर, फगवाड़ा एवं जालंधर उप-मंडल",
    mr: "एनएच-44 कॉरिडॉर, फगवाडा व जालंधर उपविभाग",
    bn: "এনএইচ-৪৪ করিডোর, ফাগওয়ারা ও জলন্ধর মহকুমা",
    ta: "NH-44 காரிடார், ஃபக்வாரா & ஜலந்தர் துணைப்பிரிவு",
    te: "NH-44 కారిడార్, ఫగ్వారా & జలంధర్ సబ్-డివిజన్",
    gu: "NH-44 કોરિડોર, ફગવાડા અને જલંધર સબ-ડિવિઝન"
  },
  "Source: Punjab Highway Police & Live Telemetry": {
    hi: "स्रोत: पंजाब हाईवे पुलिस एवं लाइव टेलीमेट्री",
    mr: "स्रोत: पंजाब महामार्ग पोलीस व थेट टेलिमेट्री",
    bn: "উৎস: পাঞ্জাব হাইওয়ে পুলিশ ও লাইভ টেলিমেট্রি",
    ta: "ஆதாரம்: பஞ்சாப் நெடுஞ்சாலை காவல் & நேரடி டெலிமெட்ரி",
    te: "మూలం: పంజాబ్ హైవే పోలీస్ & లైవ్ టెలిమెట్రీ",
    gu: "સ્ત્રોત: પંજાબ હાઇવે પોલીસ અને લાઇવ ટેલિમેટ્રી"
  },
  "Safe / Normal": {
    hi: "सुरक्षित / सामान्य",
    mr: "सुरक्षित / सामान्य",
    bn: "নিরাপদ / স্বাভাবিক",
    ta: "பாதுகாப்பானது / இயல்பு",
    te: "సురక్షితం / సాధారణం",
    gu: "સુરક્ષિત / સામાન્ય"
  },
  "Caution": {
    hi: "सावधानी",
    mr: "सावधानता",
    bn: "সতর্কতা",
    ta: "எச்சரிக்கை",
    te: "జాగ్రత్త",
    gu: "સાવચેતી"
  },
  "High Alert": {
    hi: "उच्च सतर्कता",
    mr: "अतिदक्षता",
    bn: "উচ্চ সতর্কতা",
    ta: "அதிதீவிர எச்சரிக்கை",
    te: "హై అలర్ట్",
    gu: "હાઇ એલર્ટ"
  },
  "Heritage Immersion": {
    hi: "विरासत अनुभव",
    mr: "ऐतिहासिक वारसा अनुभव",
    bn: "ঐতিহ্যবাহী অভিজ্ঞতা",
    ta: "பாரம்பரிய அனுபவம்",
    te: "వారసత్వ అనుభవం",
    gu: "વારસા અનુભવ"
  },
  "Lahaul and Spiti, Himachal Pradesh": {
    hi: "लाहौल एवं स्पीति, हिमाचल प्रदेश",
    mr: "लाहौल व स्पीती, हिमाचल प्रदेश",
    bn: "লাহুল ও স্পিতি, হিমাচল প্রদেশ",
    ta: "லாஹௌல் மற்றும் ஸ்பிதி, இமாச்சலப் பிரதேசம்",
    te: "లాహౌల్ మరియు స్పితి, హిమాచల్ ప్రదేశ్",
    gu: "લાહૌલ અને સ્પિતી, હિમાચલ પ્રદેશ"
  },
  "Rishikesh, Uttarakhand": {
    hi: "ऋषिकेश, उत्तराखंड",
    mr: "ऋषिकेश, उत्तराखंड",
    bn: "ঋষিকেশ, উত্তরাখণ্ড",
    ta: "ரிஷிகேஷ், உத்தராகண்ட்",
    te: "రిషికేశ్, ఉత్తరాఖండ్",
    gu: "ઋષિકેશ, ઉત્તરાખંડ"
  },
  "Jaipur, Rajasthan": {
    hi: "जयपुर, राजस्थान",
    mr: "जयपूर, राजस्थान",
    bn: "জয়পুর, রাজস্থান",
    ta: "ஜெய்ப்பூர், ராஜஸ்தான்",
    te: "జైపూర్, రాజస్థాన్",
    gu: "જયપુર, રાજસ્થાન"
  },
  "Dorje Tenzin": {
    hi: "दोर्जे तेनज़िन",
    mr: "दोर्जे तेनझिन",
    bn: "দোরজে তেনজিং",
    ta: "டோர்ஜே டென்சின்",
    te: "డోర్జే టెన్జిన్",
    gu: "દોરજે તેનઝિન"
  },
  "Devendra Rawat": {
    hi: "देवेन्द्र रावत",
    mr: "देवेंद्र रावत",
    bn: "দেবেন্দ্র রাওয়াত",
    ta: "தேவேந்திர ராவத்",
    te: "దేవేంద్ర రావత్",
    gu: "દેવેન્દ્ર રાવત"
  },
  "Mahipal Singh Rathore": {
    hi: "महिपाल सिंह राठौड़",
    mr: "महिपाल सिंह राठोड",
    bn: "মহিপাল সিং রাঠোর",
    ta: "மகிபால் சிங் ரத்தோர்",
    te: "మహిపాల్ సింగ్ రాథోడ్",
    gu: "મહિપાલ સિંહ રાઠોડ"
  },
  "Govt Certified Guide": {
    hi: "सरकारी प्रमाणित गाइड",
    mr: "शासकीय प्रमाणित मार्गदर्शक",
    bn: "সরকারি প্রত্যয়িত গাইড",
    ta: "அரசு சான்றளிக்கப்பட்ட வழிகாட்டி",
    te: "ప్రభుత్వ ధృవీకృత గైడ్",
    gu: "સરકારી પ્રમાણિત ગાઇડ"
  },
  "Folk dances, musical recitals, ceremonial processions, artisan exhibitions.": {
    hi: "लोक नृत्य, संगीत प्रस्तुतियां, औपचारिक शोभायात्राएं, कारीगरों की प्रदर्शनियां।",
    mr: "लोकनृत्य, संगीत मैफिली, औपचारिक मिरवणुका आणि हस्तकला प्रदर्शन.",
    bn: "লোকনৃত্য, সঙ্গীত পরিবেশনা, শোভাযাত্রা ও হস্তশিল্প প্রদর্শনী।",
    ta: "நாட்டுப்புற நடனங்கள், இசை நிகழ்ச்சிகள், சடங்கு ஊர்வலங்கள், கைவினை கண்காட்சிகள்.",
    te: "జానపద నృత్యాలు, సంగీత ప్రదర్శనలు, లాంఛనప్రాయ ఊరేగింపులు, హస్తకళల ప్రదర్శనలు.",
    gu: "લોકનૃત્યો, સંગીત કાર્યક્રમો, પરંપરાગત સરઘસો અને હસ્તકળા પ્રદર્શનો."
  },
  "Authentic festive dishes prepared by community cooks and heritage stalls.": {
    hi: "सामुदायिक रसोइयों और पारंपरिक स्टालों द्वारा तैयार किए गए प्रामाणिक उत्सव व्यंजन।",
    mr: "स्थानिक आचारी आणि पारंपरिक स्टॉल्सद्वारे तयार केलेले अस्सल सणासुदीचे पदार्थ.",
    bn: "ঐতিহ্যবাহী স্টল এবং সম্প্রদায়ের রন্ধনশিল্পীদের তৈরি খাঁটি উৎসবের পদ।",
    ta: "உள்ளூர் சமையல்காரர்களால் தயாரிக்கப்படும் உண்மையான பண்டிகை உணவுகள்.",
    te: "సంప్రదాయ స్టాళ్లలో స్థానిక వంటగాళ్లు తయారుచేసే ప్రామాణిక పండుగ వంటకాలు.",
    gu: "સ્થાનિક રસોઇયાઓ અને હેરિટેજ સ્ટોલ દ્વારા તૈયાર કરવામાં આવતી અધિકૃત ઉત્સવની વાનગીઓ."
  },
  "Indigenous handloom, terracotta pottery, brasswork, and tribal textiles.": {
    hi: "स्वदेशी हथकरघा, टेराकोटा मिट्टी के बर्तन, पीतल के काम और जनजातीय वस्त्र।",
    mr: "स्थानिक हातमाग, टेराकोटा मातीची भांडी, पितळी कलाकुसर आणि आदिवासी वस्त्रे.",
    bn: "দেশীয় তাঁত, পোড়ামাটির পাত্র, পিতলের কাজ এবং উপজাতীয় টেক্সটাইল।",
    ta: "பாரம்பரிய கைத்தறி, சுடுமண் மண்பாண்டங்கள், பித்தளை வேலைப்பாடுகள் மற்றும் பழங்குடி ஆடைகள்.",
    te: "స్వదేశీ చేనేత, టెర్రకోట మట్టిపాత్రలు, ఇత్తడి కళాకృతులు మరియు గిరిజన వస్త్రాలు.",
    gu: "સ્વદેશી હાથશાળ, ટેરાકોટા માટીકામ, પિત્તળની કારીગરી અને આદિવાસી વસ્ત્રો."
  },
  "Modest attire respectful of sacred grounds. Photography allowed in designated areas.": {
    hi: "पवित्र स्थलों के सम्मान में शालीन वस्त्र पहनें। निर्दिष्ट क्षेत्रों में फोटोग्राफी की अनुमति है।",
    mr: "पवित्र स्थळांचा आदर राखण्यासाठी योग्य पेहराव परिधान करावा. निश्चित केलेल्या भागात छायाचित्रणास परवानगी आहे.",
    bn: "পবিত্র স্থানের প্রতি সম্মান রেখে পরিমিত পোশাক পরিধান করুন। নির্দিষ্ট এলাকায় ছবি তোলার অনুমতি রয়েছে।",
    ta: "புனித தலங்களின் மரியாதைக்குரிய ஆடை அணியவும். குறிப்பிட்ட பகுதிகளில் புகைப்படம் எடுக்க அனுமதிக்கப்படுகிறது.",
    te: "పవిత్ర స్థలాల గౌరవార్థం మర్యాదపూర్వక దుస్తులు ధరించండి. నిర్దేశిత ప్రాంతాలలో ఫోటోగ్రఫీ అనుమతించబడుతుంది.",
    gu: "પવિત્ર સ્થળોના આદર માટે યોગ્ય વસ્ત્રો પહેરો. નિયુક્ત વિસ્તારોમાં ફોટોગ્રાફીની મંજૂરી છે."
  },
  "Special traffic corridors enforced": {
    hi: "विशेष यातायात गलियारे लागू किए गए हैं",
    mr: "विशेष वाहतूक कॉरिडॉर कार्यान्वित",
    bn: "বিশেষ ট্রাফিক করিডোর চালু রয়েছে",
    ta: "சிறப்பு போக்குவரத்து நடைமுறைகள் அமலில் உள்ளன",
    te: "ప్రత్యేక ట్రాఫిక్ కారిడార్లు అమలులో ఉన్నాయి",
    gu: "વિશેષ ટ્રાફિક કોરિડોર લાગુ કરવામાં આવ્યા છે"
  }
,

  // Extended Festival, Destination, State & Event Catalog Dictionary
  "West Bengal": {
    "hi": "पश्चिम बंगाल",
    "mr": "पश्चिम बंगाल",
    "bn": "পশ্চিমবঙ্গ",
    "ta": "மேற்கு வங்கம்",
    "te": "పశ్చిమ బెంగాల్",
    "gu": "પશ્ચિમ બંગાળ"
},
  "Rajasthan": {
    "hi": "राजस्थान",
    "mr": "राजस्थान",
    "bn": "রাজস্থান",
    "ta": "ராஜஸ்தான்",
    "te": "రాజస్థాన్",
    "gu": "રાજસ્થાન"
},
  "Karnataka": {
    "hi": "कर्नाटक",
    "mr": "कर्नाटक",
    "bn": "কর্ণাটক",
    "ta": "கர்நாடகா",
    "te": "కర్ణాటక",
    "gu": "કર્ણાટક"
},
  "Kerala": {
    "hi": "केरल",
    "mr": "केरळ",
    "bn": "কেরালা",
    "ta": "கேரளா",
    "te": "కేరళ",
    "gu": "કેરળ"
},
  "Gujarat": {
    "hi": "गुजरात",
    "mr": "गुजरात",
    "bn": "গুজরাট",
    "ta": "குஜராத்",
    "te": "గుజరాత్",
    "gu": "ગુજરાત"
},
  "Goa": {
    "hi": "गोवा",
    "mr": "गोवा",
    "bn": "গোয়া",
    "ta": "கோவா",
    "te": "గోవా",
    "gu": "ગોવા"
},
  "Madhya Pradesh": {
    "hi": "मध्य प्रदेश",
    "mr": "मध्य प्रदेश",
    "bn": "মধ্যপ্রদেশ",
    "ta": "மத்தியப் பிரதேசம்",
    "te": "మధ్యప్రదేశ్",
    "gu": "મધ્યપ્રદેશ"
},
  "Odisha": {
    "hi": "ओडिशा",
    "mr": "ओडिशा",
    "bn": "ওড়িশা",
    "ta": "ஒடிசா",
    "te": "ఒడిశా",
    "gu": "ઓડિશા"
},
  "Ladakh": {
    "hi": "लद्दाख",
    "mr": "लडाख",
    "bn": "লাদাখ",
    "ta": "லடாக்",
    "te": "లడఖ్",
    "gu": "લદ્દાખ"
},
  "Bihar": {
    "hi": "बिहार",
    "mr": "बिहार",
    "bn": "বিহার",
    "ta": "பீகார்",
    "te": "బీహార్",
    "gu": "બિહાર"
},
  "Telangana": {
    "hi": "तेलंगाना",
    "mr": "तेलंगणा",
    "bn": "তেলেঙ্গানা",
    "ta": "தெலுங்கானா",
    "te": "తెలంగాణ",
    "gu": "તેલંગાણા"
},
  "Andhra Pradesh": {
    "hi": "आंध्र प्रदेश",
    "mr": "आंध्र प्रदेश",
    "bn": "অন্ধ্রপ্রদেশ",
    "ta": "ஆந்திரப் பிரதேசம்",
    "te": "ఆంధ్రప్రదేశ్",
    "gu": "આંધ્રપ્રદેશ"
},
  "Tamil Nadu": {
    "hi": "तमिलनाडु",
    "mr": "तमिळनाडू",
    "bn": "তামিলনাড়ু",
    "ta": "தமிழ்நாடு",
    "te": "తమిళనాడు",
    "gu": "તમિલનાડુ"
},
  "Maharashtra": {
    "hi": "महाराष्ट्र",
    "mr": "महाराष्ट्र",
    "bn": "মহারাষ্ট্র",
    "ta": "மகாராஷ்டிரா",
    "te": "మహారాష్ట్ర",
    "gu": "મહારાષ્ટ્ર"
},
  "Himachal Pradesh": {
    "hi": "हिमाचल प्रदेश",
    "mr": "हिमाचल प्रदेश",
    "bn": "হিমাচল প্রদেশ",
    "ta": "இமாச்சலப் பிரதேசம்",
    "te": "హిమాచల్ ప్రదేశ్",
    "gu": "હિમાચલ પ્રદેશ"
},
  "Punjab": {
    "hi": "पंजाब",
    "mr": "पंजाब",
    "bn": "পাঞ্জাব",
    "ta": "பஞ்சாப்",
    "te": "పంజాబ్",
    "gu": "પંજાબ"
},
  "Jammu and Kashmir": {
    "hi": "जम्मू और कश्मीर",
    "mr": "जम्मू आणि काश्मीर",
    "bn": "জম্মু ও কাশ্মীর",
    "ta": "ஜம்மு காஷ்மீர்",
    "te": "జమ్మూ మరియు కాశ్మీర్",
    "gu": "જમ્મુ અને કાશ્મીર"
},
  "Arunachal Pradesh": {
    "hi": "अरुणाचल प्रदेश",
    "mr": "अरुणाचल प्रदेश",
    "bn": "অরুণাচল প্রদেশ",
    "ta": "அருணாச்சலப் பிரதேசம்",
    "te": "అరుణాచల్ ప్రదేశ్",
    "gu": "અરુણાચલ પ્રદેશ"
},
  "Meghalaya": {
    "hi": "मेघालय",
    "mr": "मेघालय",
    "bn": "মেঘালয়",
    "ta": "மேகாலயா",
    "te": "మేఘాలయ",
    "gu": "મેઘાલય"
},
  "Manipur": {
    "hi": "मणिपुर",
    "mr": "मणिपूर",
    "bn": "মণিপুর",
    "ta": "மணிப்பூர்",
    "te": "మణిపూర్",
    "gu": "મણિપુર"
},
  "Mizoram": {
    "hi": "मिज़ोरम",
    "mr": "मिझोराम",
    "bn": "মিজোরাম",
    "ta": "மிசோரம்",
    "te": "మిజోరం",
    "gu": "મિઝોરમ"
},
  "Nagaland": {
    "hi": "नागालैंड",
    "mr": "नागालँड",
    "bn": "নাগাল্যান্ড",
    "ta": "நாகாலாந்து",
    "te": "నాగాలాండ్",
    "gu": "નાગાલેન્ડ"
},
  "Assam": {
    "hi": "असम",
    "mr": "आसाम",
    "bn": "আসাম",
    "ta": "அசாம்",
    "te": "అస్సాం",
    "gu": "આસામ"
},
  "Haryana": {
    "hi": "हरियाणा",
    "mr": "हरियाणा",
    "bn": "হরিয়ানা",
    "ta": "ஹரியானா",
    "te": "హర్యానా",
    "gu": "હરિયાણા"
},
  "Chhattisgarh": {
    "hi": "छत्तीसगढ़",
    "mr": "छत्तीसगड",
    "bn": "ছত্তিশগড়",
    "ta": "சத்தீஸ்கர்",
    "te": "ఛత్తీస్‌గఢ్",
    "gu": "છત્તીસગઢ"
},
  "Jharkhand": {
    "hi": "झारखंड",
    "mr": "झारखंड",
    "bn": "ঝাড়খণ্ড",
    "ta": "ஜார்கண்ட்",
    "te": "జార్ఖండ్",
    "gu": "ઝારખંડ"
},
  "Uttarakhand": {
    "hi": "उत्तराखंड",
    "mr": "उत्तराखंड",
    "bn": "উত্তরাখণ্ড",
    "ta": "உத்தராகண்ட்",
    "te": "ఉత్తరాఖండ్",
    "gu": "ઉત્તરાખંડ"
},
  "Tripura": {
    "hi": "त्रिपुरा",
    "mr": "त्रिपुरा",
    "bn": "ত্রিপুরা",
    "ta": "திரிபுரா",
    "te": "త్రిపుర",
    "gu": "ત્રિપુરા"
},
  "Sikkim": {
    "hi": "सिक्किम",
    "mr": "सिक्किम",
    "bn": "সিকিম",
    "ta": "சிக்கிம்",
    "te": "సిక్కిం",
    "gu": "સિક્કિમ"
},
  "Delhi": {
    "hi": "दिल्ली",
    "mr": "दिल्ली",
    "bn": "দিল্লি",
    "ta": "டெல்லி",
    "te": "ఢిల్లీ",
    "gu": "દિલ્હી"
},
  "Chandigarh": {
    "hi": "चंडीगढ़",
    "mr": "चंदिगढ",
    "bn": "চণ্ডীগড়",
    "ta": "சண்டிகர்",
    "te": "చండీగఢ్",
    "gu": "ચંદીગઢ"
},
  "Puducherry": {
    "hi": "पुडुचेरी",
    "mr": "पुडुचेरी",
    "bn": "পুদুচেরি",
    "ta": "புதுச்சேரி",
    "te": "పుదుచ్చేరి",
    "gu": "પુડુચેરી"
},
  "Kolkata": {
    "hi": "कोलकाता",
    "mr": "कोलकाता",
    "bn": "কলকাতা",
    "ta": "கொல்கத்தா",
    "te": "కోల్‌కతా",
    "gu": "કોલકાતા"
},
  "Sagar Island": {
    "hi": "सागर द्वीप",
    "mr": "सागर बेट",
    "bn": "সাগর দ্বীপ",
    "ta": "சாகர் தீவு",
    "te": "సాగర్ ద్వీపం",
    "gu": "સાગર ટાપુ"
},
  "Pushkar": {
    "hi": "पुष्कर",
    "mr": "पुष्कर",
    "bn": "পুষ্কর",
    "ta": "புஷ்கர்",
    "te": "పుష్కర్",
    "gu": "પુષ્કર"
},
  "Faridabad": {
    "hi": "फरीदाबाद",
    "mr": "फरीदाबाद",
    "bn": "ফরিদাবাদ",
    "ta": "பரிதாபாத்",
    "te": "ఫరీదాబాద్",
    "gu": "ફરીદાબાદ"
},
  "Kisama": {
    "hi": "किसामा",
    "mr": "किसामा",
    "bn": "কিসামা",
    "ta": "கிசாமா",
    "te": "కిసామా",
    "gu": "કિસામા"
},
  "Guwahati": {
    "hi": "गुवाहाटी",
    "mr": "गुवाहाटी",
    "bn": "গুয়াহাটি",
    "ta": "குவஹாத்தி",
    "te": "గౌహతి",
    "gu": "ગુવાહાટી"
},
  "Mysuru": {
    "hi": "मैसूरु",
    "mr": "म्हैसूर",
    "bn": "মহীশূর",
    "ta": "மைசூரு",
    "te": "మైసూరు",
    "gu": "મૈસૂર"
},
  "Thrissur": {
    "hi": "त्रिशूर",
    "mr": "त्रिशूर",
    "bn": "ত্রিশূর",
    "ta": "திருச்சூர்",
    "te": "త్రిసూర్",
    "gu": "ત્રિશૂર"
},
  "Dhordo": {
    "hi": "धोरडो",
    "mr": "धोरडो",
    "bn": "ধোরডো",
    "ta": "தோர்டோ",
    "te": "ధోర్డో",
    "gu": "ધોરડો"
},
  "Ahmedabad": {
    "hi": "अहमदाबाद",
    "mr": "अहमदाबाद",
    "bn": "আহমেদাবাদ",
    "ta": "அகமதாபாத்",
    "te": "అహ్మదాబాద్",
    "gu": "અમદાવાદ"
},
  "Panaji": {
    "hi": "पणजी",
    "mr": "पणजी",
    "bn": "পানাজি",
    "ta": "பனாஜி",
    "te": "పనాజీ",
    "gu": "પણજી"
},
  "Khajuraho": {
    "hi": "खजुराहो",
    "mr": "खजुराहो",
    "bn": "খাজুরাহো",
    "ta": "கஜுராஹோ",
    "te": "ఖజురహో",
    "gu": "ખજુરાહો"
},
  "Puri": {
    "hi": "पुरी",
    "mr": "पुरी",
    "bn": "পুরী",
    "ta": "பூரி",
    "te": "పూరీ",
    "gu": "પુરી"
},
  "Konark": {
    "hi": "कोणार्क",
    "mr": "कोणार्क",
    "bn": "কোনার্ক",
    "ta": "கொனார்க்",
    "te": "కోణార్క్",
    "gu": "કોણાર્ક"
},
  "Hemis": {
    "hi": "हेमिस",
    "mr": "हेमिस",
    "bn": "হেমিস",
    "ta": "ஹெமிஸ்",
    "te": "హెమిస్",
    "gu": "હેમિસ"
},
  "Patna": {
    "hi": "पटना",
    "mr": "पटना",
    "bn": "পাটনা",
    "ta": "பாட்னா",
    "te": "పాట్నా",
    "gu": "પટના"
},
  "Hyderabad": {
    "hi": "हैदराबाद",
    "mr": "हैदराबाद",
    "bn": "হায়দ্রাবাদ",
    "ta": "ஹைதராபாத்",
    "te": "హైదరాబాద్",
    "gu": "હૈદરાબાદ"
},
  "Madurai": {
    "hi": "मदुरै",
    "mr": "मदुराई",
    "bn": "মাদুরাই",
    "ta": "மதுரை",
    "te": "మధురై",
    "gu": "મદુરાઈ"
},
  "Mumbai": {
    "hi": "मुंबई",
    "mr": "मुंबई",
    "bn": "মুম্বই",
    "ta": "மும்பை",
    "te": "ముంబై",
    "gu": "મુંબઈ"
},
  "Jaipur": {
    "hi": "जयपुर",
    "mr": "जयपूर",
    "bn": "জয়পুর",
    "ta": "ஜெய்ப்பூர்",
    "te": "జైపూర్",
    "gu": "જયપુર"
},
  "Varanasi": {
    "hi": "वाराणसी",
    "mr": "वाराणसी",
    "bn": "বারাণসী",
    "ta": "வாரணாசி",
    "te": "వారణాసి",
    "gu": "વારાણસી"
},
  "Amritsar": {
    "hi": "अमृतसर",
    "mr": "अमृतसर",
    "bn": "অমৃতসর",
    "ta": "அமிர்தசரஸ்",
    "te": "అమృత్‌సర్",
    "gu": "અમૃતસર"
},
  "All": {
    "hi": "सभी",
    "mr": "सर्व",
    "bn": "সব",
    "ta": "அனைத்தும்",
    "te": "అన్నీ",
    "gu": "બધા"
},
  "January": {
    "hi": "जनवरी",
    "mr": "जानेवारी",
    "bn": "জানুয়ারি",
    "ta": "ஜனவரி",
    "te": "జనవరి",
    "gu": "જાન્યુઆરી"
},
  "February": {
    "hi": "फरवरी",
    "mr": "फेब्रुवारी",
    "bn": "ফেব্রুয়ারি",
    "ta": "பிப்ரவரி",
    "te": "ఫిబ్రవరి",
    "gu": "ફેબ્રુઆરી"
},
  "March": {
    "hi": "मार्च",
    "mr": "मार्च",
    "bn": "মার্চ",
    "ta": "மார்ச்",
    "te": "మార్చి",
    "gu": "માર્ચ"
},
  "April": {
    "hi": "अप्रैल",
    "mr": "एप्रिल",
    "bn": "এপ্রিল",
    "ta": "ஏப்ரல்",
    "te": "ఏప్రిల్",
    "gu": "એપ્રિલ"
},
  "May": {
    "hi": "मई",
    "mr": "मे",
    "bn": "মে",
    "ta": "மே",
    "te": "మే",
    "gu": "મે"
},
  "June": {
    "hi": "जून",
    "mr": "जून",
    "bn": "জুন",
    "ta": "ஜூன்",
    "te": "జూన్",
    "gu": "જૂન"
},
  "July": {
    "hi": "जुलाई",
    "mr": "जुलै",
    "bn": "জুলাই",
    "ta": "ஜூலை",
    "te": "జూలై",
    "gu": "જુલાઈ"
},
  "August": {
    "hi": "अगस्त",
    "mr": "ऑगस्ट",
    "bn": "আগস্ট",
    "ta": "ஆகஸ்ட்",
    "te": "ఆగస్టు",
    "gu": "ઓગસ્ટ"
},
  "September": {
    "hi": "सितंबर",
    "mr": "सप्टेंबर",
    "bn": "সেপ্টেম্বর",
    "ta": "செப்டம்பர்",
    "te": "సెప్టెంబర్",
    "gu": "સપ્ટેમ્બર"
},
  "October": {
    "hi": "अक्टूबर",
    "mr": "ऑक्टोबर",
    "bn": "অক্টোবর",
    "ta": "அக்டோபர்",
    "te": "అక్టోబర్",
    "gu": "ઓક્ટોબર"
},
  "November": {
    "hi": "नवंबर",
    "mr": "नोव्हेंबर",
    "bn": "নভেম্বর",
    "ta": "நவம்பர்",
    "te": "నవంబర్",
    "gu": "નવેમ્બર"
},
  "December": {
    "hi": "दिसंबर",
    "mr": "डिसेंबर",
    "bn": "ডিসেম্বর",
    "ta": "டிசம்பர்",
    "te": "డిసెంబర్",
    "gu": "ડિસેમ્બર"
},
  "Durga Puja": {
    "hi": "दुर्गा पूजा",
    "mr": "दुर्गा पूजा",
    "bn": "দুর্গাপূজা",
    "ta": "துர்கா பூஜை",
    "te": "దుర్గా పూజ",
    "gu": "દુર્ગા પૂજા"
},
  "Kolkata Durgaotsav": {
    "hi": "कोलकाता दुर्गोत्सव",
    "mr": "कोलकाता दुर्गोत्सव",
    "bn": "কলকাতা দুর্গোৎসব",
    "ta": "கொல்கத்தா துர்கோத்சவ்",
    "te": "కోల్‌కతా దుర్గోత్సవ్",
    "gu": "કોલકાતા દુર્ગોત્સવ"
},
  "Citywide Theme Pandals & Kumartuli, West Bengal": {
    "hi": "शहरव्यापी थीम पंडाल एवं कुम्हारटोली, पश्चिम बंगाल",
    "mr": "शहरव्यापी थीम मंडप व कुंभारटोली, पश्चिम बंगाल",
    "bn": "শহরব্যাপী থিম প্যান্ডেল ও কুমারটুলি, পশ্চিমবঙ্গ",
    "ta": "நகர அளவிலான தீம் பந்தல்கள் & குமார்துலி, மேற்கு வங்கம்",
    "te": "నగరవ్యాప్త థీమ్ పండల్స్ & కుమర్తులి, పశ్చిమ బెంగాల్",
    "gu": "શહેરવ્યાપી થીમ પંડાલ અને કુમારતુલી, પશ્ચિમ બંગાળ"
},
  "Citywide Theme Pandals & Kumartuli": {
    "hi": "शहरव्यापी थीम पंडाल एवं कुम्हारटोली",
    "mr": "शहरव्यापी थीम मंडप व कुंभारटोली",
    "bn": "শহরব্যাপী থিম প্যান্ডেল ও কুমারটুলি",
    "ta": "நகர அளவிலான தீம் பந்தல்கள் & குமார்துலி",
    "te": "నగరవ్యాప్త థీమ్ పండల్స్ & కుమర్తులి",
    "gu": "શહેરવ્યાપી થીમ પંડાલ અને કુમારતુલી"
},
  "Gangasagar Mela": {
    "hi": "गंगासागर मेला",
    "mr": "गंगासागर मेळा",
    "bn": "গঙ্গাসাগর মেলা",
    "ta": "கங்காசாகர் திருவிழா",
    "te": "గంగాసాగర్ మేళా",
    "gu": "ગંગાસાગર મેળો"
},
  "Pushkar Camel Fair": {
    "hi": "पुष्कर ऊंट मेला",
    "mr": "पुष्कर उंट मेळा",
    "bn": "পুষ্কর উটের মেলা",
    "ta": "புஷ்கர் ஒட்டகத் திருவிழா",
    "te": "పుష్కర్ ఒంటెల మేళా",
    "gu": "પુષ્કર ઊંટ મેળો"
},
  "Surajkund International Crafts Mela": {
    "hi": "सूरजकुंड अंतरराष्ट्रीय शिल्प मेला",
    "mr": "सूरजकुंड आंतरराष्ट्रीय हस्तकला मेळा",
    "bn": "সূরযকুণ্ড আন্তর্জাতিক হস্তশিল্প মেলা",
    "ta": "சூரஜ்குண்ட் சர்வதேச கைவினை மேளா",
    "te": "సూరజ్ కుండ్ అంతర్జాతీయ హస్తకళల మేళా",
    "gu": "સૂરજકુંડ આંતરરાષ્ટ્રીય હસ્તકળા મેળો"
},
  "Hornbill Festival": {
    "hi": "हॉर्नबिल महोत्सव",
    "mr": "हॉर्नबिल फेस्टिव्हल",
    "bn": "হর্নবিল উৎসব",
    "ta": "ஹார்ன்பில் திருவிழா",
    "te": "హార్న్‌బిల్ ఉత్సవం",
    "gu": "હોર્નબિલ મહોત્સવ"
},
  "Bihu Celebrations (Rongali Bihu)": {
    "hi": "बिहू उत्सव (रोंगाली बिहू)",
    "mr": "बिहू उत्सव (रोंगाली बिहू)",
    "bn": "বিহু উদযাপন (রঙ্গালী বিহু)",
    "ta": "பிஹு திருவிழா (ரொங்காலி பிஹு)",
    "te": "బిహు వేడుకలు (రొంగాలీ బిహు)",
    "gu": "બિહુ ઉત્સવ (રંગાલી બિહુ)"
},
  "Mysuru Dasara": {
    "hi": "मैसूरु दशहरा",
    "mr": "म्हैसूर दसरा",
    "bn": "মহীশূর দশেরা",
    "ta": "மைசூரு தசரா",
    "te": "మైసూరు దసరా",
    "gu": "મૈસૂર દશેરા"
},
  "Onam Celebrations": {
    "hi": "ओणम उत्सव",
    "mr": "ओणम उत्सव",
    "bn": "ওনাম উদযাপন",
    "ta": "ஓணம் பண்டிகை",
    "te": "ఓణం వేడుకలు",
    "gu": "ઓણમ ઉત્સવ"
},
  "Thrissur Pooram": {
    "hi": "त्रिशूर पूरम",
    "mr": "त्रिशूर पूरम",
    "bn": "ত্রিশূর পুরম",
    "ta": "திருச்சூர் பூரம்",
    "te": "త్రిసూర్ పూరం",
    "gu": "ત્રિશૂર પૂરમ"
},
  "Rann Utsav": {
    "hi": "रण उत्सव",
    "mr": "रण उत्सव",
    "bn": "কচ্ছের রণ উৎসব",
    "ta": "ரான் உற்சவம்",
    "te": "రణ్ ఉత్సవ్",
    "gu": "રણ ઉત્સવ"
},
  "International Kite Festival (Uttarayan)": {
    "hi": "अंतरराष्ट्रीय पतंग महोत्सव (उत्तरायण)",
    "mr": "आंतरराष्ट्रीय पतंग महोत्सव (उत्तरायण)",
    "bn": "আন্তর্জাতিক ঘুড়ি উৎসব (উত্তরায়ণ)",
    "ta": "சர்வதேச பட்டத் திருவிழா (உத்தராயண்)",
    "te": "అంతర్జాతీయ గాలిపటాల పండుగ (ఉత్తరాయణం)",
    "gu": "આંતરરાષ્ટ્રીય પતંગ મહોત્સવ (ઉત્તરાયણ)"
},
  "Goa Carnival": {
    "hi": "गोवा कार्निवल",
    "mr": "गोवा कार्निव्हल",
    "bn": "গোয়া কার্নিভাল",
    "ta": "கோவா கார்னிவல்",
    "te": "గోவா కార్నివాల్",
    "gu": "ગોવા કાર્નિવલ"
},
  "Khajuraho Dance Festival": {
    "hi": "खजुराहो नृत्य महोत्सव",
    "mr": "खजुराहो नृत्य महोत्सव",
    "bn": "খাজুরাহো নৃত্য উৎসব",
    "ta": "கஜுராஹோ நடனத் திருவிழா",
    "te": "ఖజురహో నృత్యోత్సవం",
    "gu": "ખજુરાહો નૃત્ય મહોત્સવ"
},
  "Puri Rath Yatra": {
    "hi": "पुरी रथ यात्रा",
    "mr": "पुरी रथ यात्रा",
    "bn": "পুরী রথযাত্রা",
    "ta": "பூரி ரத யாத்திரை",
    "te": "పూరీ రథయాత్ర",
    "gu": "પુરી રથયાત્રા"
},
  "Konark Dance Festival": {
    "hi": "कोणार्क नृत्य महोत्सव",
    "mr": "कोणार्क नृत्य महोत्सव",
    "bn": "কোনার্ক নৃত্য উৎসব",
    "ta": "கொனார்க் நடனத் திருவிழா",
    "te": "కోణార్క్ నృత్యోత్సవం",
    "gu": "કોણાર્ક નૃત્ય મહોત્સવ"
},
  "Hemis Festival": {
    "hi": "हेमिस महोत्सव",
    "mr": "हेमिस फेस्टिव्हल",
    "bn": "হেমিস উৎসব",
    "ta": "ஹெமிஸ் திருவிழா",
    "te": "హెమిస్ ఉత్సవం",
    "gu": "હેમિસ મહોત્સવ"
},
  "Chhath Puja": {
    "hi": "छठ पूजा",
    "mr": "छठ पूजा",
    "bn": "ছট পূজা",
    "ta": "சத் பூஜை",
    "te": "ఛత్ పూజ",
    "gu": "છઠ પૂજા"
},
  "Ganesh Chaturthi": {
    "hi": "गणेश चतुर्थी",
    "mr": "गणेश चतुर्थी",
    "bn": "গণেশ চতুর্থী",
    "ta": "விநாயகர் சதுர்த்தி",
    "te": "వినాయక చవితి",
    "gu": "ગણેશ ચતુર્થી"
},
  "Pongal Harvest Festival": {
    "hi": "पोंगल फसल उत्सव",
    "mr": "पोंगल पीक उत्सव",
    "bn": "পোঙ্গল ফসল কাটার উৎসব",
    "ta": "பொங்கல் அறுவடைத் திருநாள்",
    "te": "పొంగల్ పంటల పండుగ",
    "gu": "પોંગલ લણણી ઉત્સવ"
},
  "Durga Puja in Kolkata transforms the city into an epicenter of public art, architectural installations, and devotional ecstasy. Artisans in Kumartuli sculpt life-sized clay deities, while communities compete with avant-garde theme pandals. Marked by rhythmic Dhaak beats, aromatic Dhunuchi dances, Sindoor Khela on Dashami, and late-night culinary exploration.": {
    "hi": "कोलकाता में दुर्गा पूजा पूरे शहर को सार्वजनिक कला, भव्य वास्तुशिल्प और भक्तिमय आनंद के एक विशाल केंद्र में बदल देती है। कुम्हारटोली के मूर्तिकार मिट्टी की जीवंत प्रतिमाएं गढ़ते हैं, जबकि पूजा समितियां अभिनव थीम पंडालों का निर्माण करती हैं। यह उत्सव ढाक की गूंज, धुनुची नृत्य, दशमी के सिंदूर खेला और देर रात के लज़ीज़ व्यंजनों के लिए प्रसिद्ध है।",
    "mr": "कोलकाता येथील दुर्गा पूजा संपूर्ण शहराला भव्य कला, वास्तुकला आणि भक्तीमय उत्सवात रूपांतरित करते. कुंभारटोलीचे मूर्तिकार मातीच्या अप्रतिम मूर्ती घडवतात, तर विविध मंडळे आगळेवेगळे थीम पंडाल उभारतात. ढाकचे तालबद्ध वादन, धुनुची नृत्य, दशमीचा सिंदूर खेला आणि रात्रीचा खाद्यसंस्कृतीचा आनंद हे या उत्सवाचे मुख्य वैशिष्ट्य आहे.",
    "bn": "কলকাতার দুর্গাপূজা সমগ্র শহরকে উন্মুক্ত শিল্পকলা, অনন্য স্থাপত্য ও ভক্তিপূর্ণ আনন্দের কেন্দ্রবিন্দুতে পরিণত করে। কুমারটুলির শিল্পীরা নিখুঁত মাটির প্রতিমা গড়েন এবং শহরজুড়ে গড়ে ওঠে মনোমুগ্ধকর থিম প্যান্ডেল। ঢাকের বাদ্যি, মনমাতানো ধুনুচি নাচ, বিজয়ার সিঁদুর খেলা এবং গভীর রাতের রসনাতৃপ্তি এই উৎসবের মূল আকর্ষণ।",
    "ta": "கொல்கத்தாவின் துர்கா பூஜை நகரம் முழுவதையும் கண்கவர் பொதுக்கலை, கட்டிடக்கலை வடிவமைப்பு மற்றும் பக்தி பரவசத்தின் மையமாக மாற்றுகிறது. குமார்துலி கலைஞர்கள் களிமண் சிலைகளை வடிக்கின்றனர். தாக் மேள முழக்கம், துனுச்சி நடனம், விஜயதசமி சிந்தூர் கேலா மற்றும் இரவு நேர உணவு திருவிழா இதன் முக்கிய அம்சங்களாகும்.",
    "te": "కోల్‌కతాలోని దుర్గా పూజ నగరాన్ని అద్భుతమైన బహిరంగ కళారూపాలు, నిర్మాణ నైపుణ్యం మరియు భక్తి ప్రపత్తుల కేంద్రంగా మారుస్తుంది. కుమర్తులి కళాకారులు అద్భుతమైన మట్టి విగ్రహాలను రూపొందిస్తారు. ఢాక్ వాయిద్యాలు, ధునుచి నృత్యాలు, సింధూర్ ఖేలా మరియు రాత్రిపూట ఆహార సంబరాలు దీని ప్రత్యేకతలు.",
    "gu": "કોલકાતામાં દુર્ગા પૂજા સમગ્ર શહેરને ભવ્ય જાહેર કલા, સ્થાપત્ય અને ભક્તિભાવના કેન્દ્રમાં ફેરવી નાખે છે. કુમારતુલીના કારીગરો માટીની સુંદર પ્રતિમાઓ ઘડે છે અને અવનવા થીમ પંડાલો સજાવવામાં આવે છે. ઢાકના ધબકારા, ધુનુચી નૃત્ય, સિંદૂર ખેલા અને મોડી રાતની વાનગીઓ આ ઉત્સવની વિશેષતા છે."
},
  "Traced to the 16th-century zamindars of Bengal, modern community (Barowari) celebrations began in 1909, becoming a nationalist symbol during the Indian freedom struggle and inscribed by UNESCO in 2021 as a masterpiece of intangible heritage.": {
    "hi": "16वीं शताब्दी के बंगाल के जमींदारों से शुरू होकर, आधुनिक सामुदायिक (बारोवारी) उत्सव 1909 में प्रारंभ हुआ। यह भारतीय स्वतंत्रता संग्राम के दौरान राष्ट्रवादी एकता का प्रतीक बना और 2021 में यूनेस्को (UNESCO) द्वारा अमूर्त सांस्कृतिक विरासत के रूप में मान्यता प्राप्त हुआ।",
    "mr": "16 व्या शतकातील बंगालच्या जमीनदारांपासून सुरू झालेला आधुनिक सार्वजनिक (बारोवारी) उत्सव 1909 मध्ये सुरू झाला. भारतीय स्वातंत्र्यलढ्यात तो राष्ट्रीय ऐक्याचे प्रतीक ठरला आणि 2021 मध्ये युनेस्को (UNESCO) द्वारे अमूर्त सांस्कृतिक वारसा म्हणून गौरवण्यात आला.",
    "bn": "১৬শ শতাব্দীর বাংলার জমিদারদের হাত ধরে শুরু হলেও, ১৯০৯ সালে আধুনিক বারোয়ারি সর্বজনীন পূজার সূচনা হয়। এটি ভারতের স্বাধীনতা সংগ্রামে জাতীয়তাবাদী ঐক্যের প্রতীক হয়ে ওঠে এবং ২০২১ সালে ইউনেস্কো (UNESCO) কর্তৃক মানবজাতির অমূর্ত সাংস্কৃতিক ঐতিহ্য হিসেবে স্বীকৃতি পায়।",
    "ta": "16-ஆம் நூற்றாண்டின் வங்காள ஜமீன்தார்களிடம் தொடங்கிய நவீன பொது (பரோவாரி) கொண்டாட்டங்கள் 1909-ல் தொடங்கின. இந்திய சுதந்திரப் போராட்டத்தின் போது இது தேசியவாதத்தின் அடையாளமாக மாறியது மற்றும் 2021-ல் யுனெஸ்கோ (UNESCO) பாரம்பரிய சின்னமாக அறிவிக்கப்பட்டது.",
    "te": "16వ శతాబ్దపు బెంగాల్ జమీందార్ల నుండి ప్రారంభమై, ఆధునిక సామూహిక (బారోవారీ) ఉత్సవాలు 1909లో మొదలయ్యాయి. భారత స్వాతంత్ర్య పోరాటంలో ఇది జాతీయ ఐక్యతకు చిహ్నంగా నిలిచింది మరియు 2021లో యునెస్కో (UNESCO) వారసత్వ సంపదగా గుర్తించబడింది.",
    "gu": "16મી સદીના બંગાળના જમીનદારોથી શરૂ થયેલી આ પરંપરામાં 1909માં આધુનિક સાર્વજનિક (બારોવારી) પૂજા શરૂ થઈ. ભારતીય સ્વતંત્રતા સંગ્રામ દરમિયાન તે રાષ્ટ્રવાદી એકતાનું પ્રતીક બની અને 2021માં યુનેસ્કો (UNESCO) દ્વારા અમૂર્ત સાંસ્કૃતિક વારસા તરીકે માન્યતા મળી."
},
  "Unites all communities across barriers of faith and caste, showcasing traditional Dokra, clay craftsmanship, folk music, and Bengali culinary traditions.": {
    "hi": "जाति और धर्म के बंधनों से परे सभी समुदायों को एकजुट करता है तथा पारंपरिक डोकरा शिल्प, मृण्मूर्ति निर्माण, लोक संगीत और बंगाली खान-पान की समृद्ध परंपराओं को प्रदर्शित करता है।",
    "mr": "धर्म आणि जातीच्या भिंती ओलांडून सर्व समुदायांना एकत्र आणतो, पारंपरिक डोकरा धातूकला, मातीकाम, लोकसंगीत आणि बंगाली खाद्यसंस्कृतीचे दर्शन घडवतो.",
    "bn": "ধর্ম ও বর্ণের ভেদাভেদ ভুলে সকল সম্প্রদায়কে ঐক্যবদ্ধ করে এবং ঐতিহ্যবাহী ডোকরা শিল্প, মৃৎশিল্প, লোকসঙ্গীত ও বাঙালি রসনা ঐতিহ্যকে বিশ্বমঞ্চে তুলে ধরে।",
    "ta": "மதம் மற்றும் சாதி வேறுபாடுகளைக் கடந்து அனைத்து மக்களையும் ஒன்றிணைக்கிறது. பாரம்பரிய டோக்ரா உலோக வேலைப்பாடு, களிமண் கலை, நாட்டுப்புற இசை மற்றும் வங்காள உணவு வகைகளை வெளிப்படுத்துகிறது.",
    "te": "మతం మరియు కుల భేదాలు లేకుండా అన్ని వర్గాల ప్రజలను ఏకం చేస్తుంది. సాంప్రదాయ డోక్రా లోహకళ, మట్టి శిల్పకళ, జానపద సంగీతం మరియు బెంగాలీ వంటకాల వైభవాన్ని ప్రతిబింబిస్తుంది.",
    "gu": "જ્ઞાતિ અને ધર્મના ભેદભાવ વિના તમામ સમુદાયોને એક કરે છે અને પરંપરાગત ડોકરા શિલ્પ, માટીકામ, લોકસંગીત અને બંગાળી ખાનપાનની સમૃદ્ધ પરંપરાઓને પ્રદર્શિત કરે છે."
},
  "India's greatest open-air public art and religious carnival celebrating the victory of Goddess Durga with thousands of monumental pandals, traditional Dhunuchi dance, and exquisite clay idols.": {
    "hi": "हजारों भव्य पंडालों, पारंपरिक धुनुची नृत्य और उत्तम मिट्टी की मूर्तियों के साथ मां दुर्गा की विजय का उत्सव मनाने वाला भारत का सबसे बड़ा खुला सार्वजनिक कला और धार्मिक कार्निवल।",
    "mr": "हजारो भव्य मंडप, पारंपारिक धुनुची नृत्य आणि अप्रतिम मातीच्या मूर्तींसह देवी दुर्गेच्या विजयाचा उत्सव साजरा करणारा भारतातील सर्वात मोठा खुला कला व धार्मिक कार्निव्हल.",
    "bn": "হাজার হাজার সুবিশাল প্যান্ডেল, ঐতিহ্যবাহী ধুনুচি নাচ এবং অনন্য মৃন্ময়ী প্রতিমার সাথে মা দুর্গার বিজয় উদযাপনের জন্য ভারতের সর্ববৃহৎ উন্মুক্ত শিল্পকলা ও উৎসব।",
    "ta": "ஆயிரக்கணக்கான பிரம்மாண்ட பந்தல்கள், பாரம்பரிய துனுச்சி நடனம் மற்றும் களிமண் சிலைகளுடன் துர்கா தேவியின் வெற்றியை கொண்டாடும் இந்தியாவின் மிகப்பெரிய பொதுக்கலை மற்றும் ஆன்மீக திருவிழா.",
    "te": "వేలాది అద్భుతమైన పండల్స్, సాంప్రదాయ ధునుచి నృత్యం మరియు మట్టి విగ్రహాలతో దుర్గాదేవి విజయోత్సవాన్ని జరుపుకునే భారతదేశపు అతిపెద్ద బహిరంగ కళా మరియు ఆధ్యాత్మిక ఉత్సవం.",
    "gu": "હજારો ભવ્ય પંડાલો, પરંપરાગત ધુનુચી નૃત્ય અને માટીની અદ્ભુત પ્રતિમાઓ સાથે માતા દુર્ગાના વિજયની ઉજવણી કરતો ભારતનો સૌથી મોટો સાર્વજનિક કલા અને ધાર્મિક મહોત્સવ."
},
  "Kumartuli Sculptors Walk, Dhunuchi Naach, Pandal Hopping, Sindoor Khela, Ganga Immersion": {
    "hi": "कुम्हारटोली मूर्तिकार वॉक, धुनुची नाच, पंडाल दर्शन, सिंदूर खेला, गंगा विसर्जन",
    "mr": "कुंभारटोली मूर्तिकार सफर, धुनुची नृत्य, मंडप दर्शन, सिंदूर खेला, गंगा विसर्जन",
    "bn": "কুমারটুলি ভাস্কর দর্শন, ধুনুচি নাচ, প্যান্ডেল হপিং, সিঁদুর খেলা, গঙ্গা বিসর্জন",
    "ta": "குமார்துலி சிற்பிகள் உலா, துனுச்சி நடனம், பந்தல் தரிசனம், சிந்தூர் கேலா, கங்கை விசர்ஜனம்",
    "te": "కుమర్తులి శిల్పుల నడక, ధునుచి నాట్యం, పండల్ సందర్శన, సింధూర్ ఖేలా, గంగా నిమజ్జనం",
    "gu": "કુમારતુલી શિલ્પકાર વૉક, ધુનુચી નૃત્ય, પંડાલ દર્શન, સિંદૂર ખેલા, ગંગા વિસર્જન"
},
  "Kathi Rolls, Kolkata Biryani, Pitha, Rasgulla, Sandesh, Phuchka, Kosha Mangsho": {
    "hi": "काठी रोल्स, कोलकाता बिरयानी, पीठा, रसगुल्ला, संदेश, फुचका, कोशा मांगशो",
    "mr": "काठी रोल्स, कोलकाता बिर्याणी, पिठा, रसगुल्ला, संदेश, फुचका, कोशा मांगशो",
    "bn": "কাঠি রোল, কলকাতা বিরিয়ানি, পিঠে, রসগোল্লা, সন্দেশ, ফুচকা, কষা মাংস",
    "ta": "காத்தி ரோல்ஸ், கொல்கத்தா பிரியாணி, பீதா, ரசகுல்லா, சந்தேஷ், புச்கா, கோஷா மாங்சோ",
    "te": "కాథీ రోల్స్, కోల్‌కతా బిర్యానీ, పీఠా, రసగుల్లా, సందేశ్, ఫుచ్కా, కోషా మాంగ్షో",
    "gu": "કાઠી રોલ્સ, કોલકાતા બિરયાની, પીઠા, રસગુલ્લા, સંદેશ, ફુચકા, કોશા માંગશો"
},
  "Kumartuli Clay Idols, Sholapith Craft, Baluchari & Jamdani Sarees, Dokra Metalwork": {
    "hi": "कुम्हारटोली मिट्टी की मूर्तियां, शोलापीठ शिल्प, बालूचरी व जामदानी साड़ियां, डोकरा धातुशिल्प",
    "mr": "कुंभारटोली मातीच्या मूर्ती, शोलापीठ कला, बालुचरी व जामदानी साड्या, डोकरा धातूकाम",
    "bn": "কুমারটুলির মাটির প্রতিমা, শোলার কাজ, বালুচরী ও জামদানি শাড়ি, ডোকরা ধাতব শিল্প",
    "ta": "குமார்துலி களிமண் சிலைகள், சோலாபீத் கைவினை, பாலுச்சாரி & ஜாம்தானி சேலைகள், டோக்ரா உலோக வேலைப்பாடு",
    "te": "కుమర్తులి మట్టి విగ్రహాలు, షోలాపీత్ చేతిపనులు, బాలుచరి & జామ్‌దానీ చీరలు, డోక్రా లోహకళ",
    "gu": "કુમારતુલી માટીની મૂર્તિઓ, શોલાપીઠ હસ્તકલા, બાલુચરી અને જામદાની સાડીઓ, ડોકરા ધાતુકળા"
},
  "Modest clothing recommended when entering sanctum sanctorum of pandals. Photography permitted outside inner sanctum. Remove shoes before stepping onto altar.": {
    "hi": "पंडालों के गर्भगृह में प्रवेश करते समय शालीन वस्त्र पहनें। गर्भगृह के बाहर फोटोग्राफी की अनुमति है। वेदी पर चढ़ने से पहले जूते-चप्पल उतारें।",
    "mr": "मंडपांच्या गर्भगृहात प्रवेश करताना सभ्य पोशाख परिधान करावा. गर्भगृहाबाहेर छायाचित्रणास परवानगी आहे. वेदीवर जाण्यापूर्वी पादत्राणे काढावीत.",
    "bn": "প্যান্ডেলের গর্ভগৃহে প্রবেশের সময় শালীন পোশাক পরিধানের পরামর্শ দেওয়া হয়। গর্ভগৃহের বাইরে ছবি তোলার অনুমতি রয়েছে। বেদীতে ওঠার আগে জুতো খুলুন।",
    "ta": "பந்தல்களின் கருவறைக்குள் நுழையும் போது கண்ணியமான ஆடை அணிய பரிந்துரைக்கப்படுகிறது. கருவறைக்கு வெளியே புகைப்படம் எடுக்க அனுமதி உண்டு. பலிபீடத்திற்கு முன் காலணிகளை கழற்றவும்.",
    "te": "పండల్స్ గర్భగుడిలోకి ప్రవేశించేటప్పుడు సాంప్రదాయ దుస్తులు ధరించాలి. గర్భగుడి వెలుపల ఫోటోగ్రఫీ అనుమతించబడుతుంది. బలిపీఠం వద్ద పాదరక్షలు విప్పాలి.",
    "gu": "પંડાલના ગર્ભગૃહમાં પ્રવેશતી વખતે મર્યાદિત વસ્ત્રો પહેરવાની ભલામણ છે. ગર્ભગૃહની બહાર ફોટોગ્રાફી માન્ય છે. વેદી પર જતા પહેલાં પગરખાં ઉતારો."
},
  "Very High (10+ Million Cumulative)": {
    "hi": "अत्यधिक (1 करोड़+ संचयी)",
    "mr": "अतिउच्च (1 कोटी+ एकत्रित)",
    "bn": "অত্যন্ত উচ্চ (১ কোটি+ সর্বমোট)",
    "ta": "மிக அதிகம் (1 கோடிக்கும் மேல்)",
    "te": "చాలా ఎక్కువ (1 కోటి+ మొత్తం)",
    "gu": "અતિશય ઊંચો (1 કરોડ+ સંચયી)"
},
  "District Administration / State Tourism Official Statistics": {
    "hi": "जिला प्रशासन / राज्य पर्यटन आधिकारिक सांख्यिकी",
    "mr": "जिल्हा प्रशासन / राज्य पर्यटन अधिकृत आकडेवारी",
    "bn": "জেলা প্রশাসন / রাজ্য পর্যটন সরকারি পরিসংখ্যান",
    "ta": "மாவட்ட நிர்வாகம் / மாநில சுற்றுலா அதிகாரப்பூர்வ புள்ளிவிவரங்கள்",
    "te": "జిల్లా పరిపాలన / రాష్ట్ర పర్యాటక అధికారిక గణాంకాలు",
    "gu": "જિલ્લા વહીવટીતંત્ર / રાજ્ય પ્રવાસન સત્તાવાર આંકડા"
},
  "Kolkata Metro runs round-the-clock during festival nights. Private vehicular movement restricted in pandal zones. Dedicated special tourist buses available.": {
    "hi": "उत्सव की रातों में कोलकाता मेट्रो 24 घंटे चलती है। पंडाल क्षेत्रों में निजी वाहनों की आवाजाही प्रतिबंधित रहती है। विशेष पर्यटक बसें उपलब्ध हैं।",
    "mr": "उत्सवाच्या रात्री कोलकाता मेट्रो २४ तास चालते. मंडप परिसरात खाजगी वाहनांना बंदी असते. विशेष पर्यटक बसेस उपलब्ध असतात.",
    "bn": "উৎসবের দিনগুলিতে কলকাতা মেট্রো সারারাত চলাচল করে। প্যান্ডেল অঞ্চলে ব্যক্তিগত যান চলাচল নিয়ন্ত্রিত থাকে। বিশেষ পর্যটন বাস পরিষেবা উপলব্ধ।",
    "ta": "திருவிழா இரவுகளில் கொல்கத்தா மெட்ரோ 24 மணி நேரமும் இயங்கும். பந்தல் பகுதிகளில் தனியார் வாகனப் போக்குவரத்து தடைசெய்யப்பட்டுள்ளது. சிறப்பு சுற்றுலா பேருந்துகள் உள்ளன.",
    "te": "పండుగ రాత్రులలో కోల్‌కతా మెట్రో 24 గంటలూ నడుస్తుంది. పండల్ ప్రాంతాలలో ప్రైవేట్ వాహనాల రాకపోకలు పరిమితం. ప్రత్యేక పర్యాటక బస్సులు అందుబాటులో ఉన్నాయి.",
    "gu": "તહેવારની રાત્રિઓમાં કોલકાતા મેટ્રો 24 કલાક ચાલે છે. પંડાલ વિસ્તારોમાં ખાનગી વાહનોની અવરજવર પર પ્રતિબંધ છે. વિશેષ પ્રવાસી બસો ઉપલબ્ધ છે."
},
  "Well-connected via State Highways and National Corridors; event-specific parking designated.": {
    "hi": "राज्य राजमार्गों और राष्ट्रीय गलियारों से अच्छी तरह जुड़ा हुआ; उत्सव के लिए विशेष पार्किंग निर्धारित।",
    "mr": "राज्य महामार्ग आणि राष्ट्रीय महामार्गांशी उत्तम जोडलेले; उत्सवासाठी स्वतंत्र पार्किंग व्यवस्था.",
    "bn": "রাজ্য ও জাতীয় মহাসড়কের মাধ্যমে সুসংযুক্ত; উৎসবের জন্য নির্দিষ্ট পার্কিং ব্যবস্থা রয়েছে।",
    "ta": "மாநில மற்றும் தேசிய நெடுஞ்சாலைகளுடன் நன்கு இணைக்கப்பட்டுள்ளது; திருவிழாவிற்கான பிரத்யேக வாகன நிறுத்துமிடம் உள்ளது.",
    "te": "రాష్ట్ర మరియు జాతీయ రహదారులతో అనుసంధానించబడింది; పండుగ కోసం ప్రత్యేక పార్కింగ్ ఏర్పాట్లు కలవు.",
    "gu": "રાજ્ય ધોરીમાર્ગો અને રાષ્ટ્રીય કોરિડોર સાથે સારી રીતે જોડાયેલું; ઉત્સવ માટે ખાસ પાર્કિંગ નક્કી કરેલ છે."
},
  "State transport buses, shared autos, and tourist taxis available.": {
    "hi": "राज्य परिवहन बसें, शेयर्ड ऑटो और पर्यटक टैक्सियां उपलब्ध हैं।",
    "mr": "राज्य परिवहन बसेस, शेअर रिक्षा आणि पर्यटक टॅक्सी उपलब्ध आहेत.",
    "bn": "রাজ্য পরিবহন বাস, শেয়ার অটো এবং পর্যটন ট্যাক্সি পরিষেবা উপলব্ধ।",
    "ta": "அரசுப் பேருந்துகள், ஷேர் ஆட்டோக்கள் மற்றும் சுற்றுலா டாக்சிகள் கிடைக்கின்றன.",
    "te": "రాష్ట్ర రవాణా బస్సులు, షేర్డ్ ఆటోలు మరియు టూరిస్ట్ టాక్సీలు అందుబాటులో ఉన్నాయి.",
    "gu": "રાજ્ય પરિવહન બસો, શેરિંગ રિક્ષા અને પ્રવાસી ટેક્સીઓ ઉપલબ્ધ છે."
},
  "West Bengal Tourism / Incredible India": {
    "hi": "पश्चिम बंगाल पर्यटन / इनक्रेडिबल इंडिया",
    "mr": "पश्चिम बंगाल पर्यटन / इनक्रेडिबल इंडिया",
    "bn": "পশ্চিমবঙ্গ পর্যটন / ইনক্রেডিবল ইন্ডিয়া",
    "ta": "மேற்கு வங்க சுற்றுலா / இன்க்ரெடிபிள் இந்தியா",
    "te": "పశ్చిమ బెంగాల్ టూరిజం / ఇంక్రెడిబుల్ ఇండియా",
    "gu": "પશ્ચિમ બંગાળ પ્રવાસન / ઇનક્રેડિબલ ઇન્ડિયા"
},
  "UNESCO Intangible Cultural Heritage": {
    "hi": "यूनेस्को अमूर्त सांस्कृतिक विरासत",
    "mr": "युनेस्को अमूर्त सांस्कृतिक वारसा",
    "bn": "ইউনেস্কো অমূর্ত সাংস্কৃতিক ঐতিহ্য",
    "ta": "யுனெஸ்கோ கலாச்சார பாரம்பரியம்",
    "te": "యునెస్కో సాంస్కృతిక వారసత్వం",
    "gu": "યુનેસ્કો અમૂર્ત સાંસ્કૃતિક વારસો"
},
  "Inscribed 2021 (Representative List)": {
    "hi": "2021 में अंकित (प्रतिनिधि सूची)",
    "mr": "2021 मध्ये नोंदणीकृत (प्रतिनिधी सूची)",
    "bn": "২০২১ সালে তালিকাভুক্ত (প্রতিনিধিত্বমূলক তালিকা)",
    "ta": "2021-ல் பதிவு செய்யப்பட்டது (பிரதிநிதித்துவ பட்டியல்)",
    "te": "2021లో నమోదు చేయబడింది (ప్రాతినిధ్య జాబితా)",
    "gu": "2021 માં અંકિત (પ્રતિનિધિ યાદી)"
},
  "Tier 1 - National / International": {
    "hi": "श्रेणी 1 - राष्ट्रीय / अंतरराष्ट्रीय",
    "mr": "श्रेणी 1 - राष्ट्रीय / आंतरराष्ट्रीय",
    "bn": "স্তর ১ - জাতীয় / আন্তর্জাতিক",
    "ta": "நிலை 1 - தேசிய / சர்வதேச",
    "te": "స్థాయి 1 - జాతీయ / అంతర్జాతీయ",
    "gu": "સ્તર 1 - રાષ્ટ્રીય / આંતરરાષ્ટ્રીય"
},
  "TIER 1": {
    "hi": "श्रेणी 1",
    "mr": "श्रेणी 1",
    "bn": "স্তর ১",
    "ta": "நிலை 1",
    "te": "స్థాయి 1",
    "gu": "સ્તર 1"
},
  "Tier 1": {
    "hi": "श्रेणी 1",
    "mr": "श्रेणी 1",
    "bn": "স্তর ১",
    "ta": "நிலை 1",
    "te": "స్థాయి 1",
    "gu": "સ્તર 1"
},
  "Tier 2": {
    "hi": "श्रेणी 2",
    "mr": "श्रेणी 2",
    "bn": "স্তর ২",
    "ta": "நிலை 2",
    "te": "స్థాయి 2",
    "gu": "સ્તર 2"
},
  "Tier 3": {
    "hi": "श्रेणी 3",
    "mr": "श्रेणी 3",
    "bn": "স্তর ৩",
    "ta": "நிலை 3",
    "te": "స్థాయి 3",
    "gu": "સ્તર 3"
},
  "HIGH": {
    "hi": "उच्च",
    "mr": "उच्च",
    "bn": "উচ্চ",
    "ta": "உயர்",
    "te": "అధిక",
    "gu": "ઉચ્ચ"
},
  "MODERATE": {
    "hi": "मध्यम",
    "mr": "मध्यम",
    "bn": "মাঝারি",
    "ta": "மிதமான",
    "te": "మితమైన",
    "gu": "મધ્યમ"
},
  "LOW": {
    "hi": "कम",
    "mr": "कमी",
    "bn": "কম",
    "ta": "குறைவு",
    "te": "తక్కువ",
    "gu": "ઓછું"
},
  "Very High": {
    "hi": "अत्यधिक",
    "mr": "खूप जास्त",
    "bn": "অত্যন্ত উচ্চ",
    "ta": "மிக அதிகம்",
    "te": "చాలా ఎక్కువ",
    "gu": "ખૂબ ઊંચું"
},
  "High": {
    "hi": "अधिक",
    "mr": "जास्त",
    "bn": "উচ্চ",
    "ta": "அதிகம்",
    "te": "ఎక్కువ",
    "gu": "ઊંચું"
},
  "Moderate": {
    "hi": "मध्यम",
    "mr": "मध्यम",
    "bn": "মাঝারি",
    "ta": "மிதமான",
    "te": "மితమైన",
    "gu": "મધ્યમ"
},
  "Comfortable": {
    "hi": "सुविधाजनक",
    "mr": "सोयीस्कर",
    "bn": "আরামদায়ক",
    "ta": "வசதியானது",
    "te": "సౌకర్యవంతమైన",
    "gu": "આરામદાયક"
},
  "Normal": {
    "hi": "सामान्य",
    "mr": "सामान्य",
    "bn": "স্বাভাবিক",
    "ta": "இயல்பு",
    "te": "సాధారణం",
    "gu": "સામાન્ય"
},
  "Congested": {
    "hi": "भीड़भाड़ युक्त",
    "mr": "गर्दीचे",
    "bn": "জনাকীর্ণ",
    "ta": "நெரிசலான",
    "te": "రద్దీగా ఉండే",
    "gu": "ભીડભાડવાળું"
},
  "Real Verified Listings": {
    "hi": "वास्तविक सत्यापित सूचियां",
    "mr": "प्रत्यक्ष पडताळणी केलेल्या याद्या",
    "bn": "বাস্তব যাচাইকৃত তালিকা",
    "ta": "உண்மையான சரிபார்க்கப்பட்ட பதிவுகள்",
    "te": "నిజమైన ధృవీకరించబడిన జాబితాలు",
    "gu": "વાસ્તવિક ચકાસાયેલ યાદીઓ"
},
  "Curated Dining & Regional Cuisines": {
    "hi": "चयनित खानपान एवं क्षेत्रीय व्यंजन",
    "mr": "निवडक भोजन व प्रादेशिक खाद्यसंस्कृती",
    "bn": "বাছাইকৃত ডাইনিং ও আঞ্চলিক রন্ধনশৈলী",
    "ta": "தேர்ந்தெடுக்கப்பட்ட உணவகங்கள் & பிராந்திய உணவுகள்",
    "te": "ఎంపిక చేసిన భోజనం & ప్రాంతీయ వంటకాలు",
    "gu": "પસંદગીના ભોજનાલયો અને પ્રાદેશિક વાનગીઓ"
},
  "Festival Categories": {
    "hi": "उत्सव श्रेणियां",
    "mr": "महोत्सव श्रेणी",
    "bn": "উৎসবের বিভাগ",
    "ta": "திருவிழா வகைகள்",
    "te": "పండుగ విభాగాలు",
    "gu": "મહોત્સવ શ્રેણીઓ"
},
  "Cultural": {
    "hi": "सांस्कृतिक",
    "mr": "सांस्कृतिक",
    "bn": "সাংস্কৃতিক",
    "ta": "கலாச்சாரம்",
    "te": "సాంస్కృతిక",
    "gu": "સાંસ્કૃતિક"
},
  "Harvest / Seasonal": {
    "hi": "फसल / मौसमी",
    "mr": "हंगामी / पीक उत्सव",
    "bn": "ফসল / ঋতুভিত্তিক",
    "ta": "அறுவடை / பருவகாலம்",
    "te": "పంట / కాలానుగుణ",
    "gu": "લણણી / મોસમી"
},
  "Mela / Livestock": {
    "hi": "मेला / पशुधन",
    "mr": "मेळा / पशुधन",
    "bn": "মেলা / গবাদিপশু",
    "ta": "மேளா / கால்நடை",
    "te": "మేళా / పశుసంపద",
    "gu": "મેળો / પશુધન"
},
  "Heritage / Historical": {
    "hi": "धरोहर / ऐतिहासिक",
    "mr": "वारसा / ऐतिहासिक",
    "bn": "ঐতিহ্য / ঐতিহাসিক",
    "ta": "பாரம்பரியம் / வரலாறு",
    "te": "వారసత్వం / చారిత్రక",
    "gu": "વારસો / ઐતિહાસિક"
},
  "Music & Tribal Arts": {
    "hi": "संगीत एवं जनजातीय कलाएं",
    "mr": "संगीत व आदिवासी कला",
    "bn": "সঙ্গীত ও উপজাতীয় শিল্পকলা",
    "ta": "இசை & பழங்குடி கலைகள்",
    "te": "సంగీతం & గిరిజన కళలు",
    "gu": "સંગીત અને આદિવાસી કળા"
},
  "Explore Event": {
    "hi": "उत्सव देखें",
    "mr": "उत्सव पहा",
    "bn": "উৎসব দেখুন",
    "ta": "திருவிழாவை காண்க",
    "te": "ఉత్సవాన్ని అన్వేషించండి",
    "gu": "મહોત્સવ જુઓ"
},
  "UNESCO Only": {
    "hi": "केवल यूनेस्को",
    "mr": "केवळ युनेस्को",
    "bn": "শুধুমাত্র ইউনেস্কো",
    "ta": "யுனெஸ்கோ மட்டும்",
    "te": "యునెస్కో మాత్రమే",
    "gu": "માત્ર યુનેસ્કો"
},
  "Grid": {
    "hi": "ग्रिड",
    "mr": "ग्रिड",
    "bn": "গ্রিড",
    "ta": "கட்டம்",
    "te": "గ్రిడ్",
    "gu": "ગ્રિડ"
},
  "Map": {
    "hi": "मानचित्र",
    "mr": "नकाशा",
    "bn": "মানচিত্র",
    "ta": "வரைபடம்",
    "te": "మ్యాప్",
    "gu": "નકશો"
},
  "Search": {
    "hi": "खोजें",
    "mr": "शोधा",
    "bn": "অনুসন্ধান",
    "ta": "தேடு",
    "te": "శోధించు",
    "gu": "શોધો"
},
  "Loading India's cultural festival catalog...": {
    "hi": "भारत के सांस्कृतिक उत्सव कैटलॉग लोड हो रहे हैं...",
    "mr": "भारतातील सांस्कृतिक महोत्सवांची यादी लोड होत आहे...",
    "bn": "ভারতের সাংস্কৃতিক উৎসব ক্যাটালগ লোড হচ্ছে...",
    "ta": "இந்தியாவின் கலாச்சார திருவிழா பட்டியல் ஏற்றப்படுகிறது...",
    "te": "భారతదేశ సాంస్కృతిక పండుగల జాబితా లోడ్ అవుతోంది...",
    "gu": "ભારતના સાંસ્કૃતિક મહોત્સવોની યાદી લોડ થઈ રહી છે..."
},
  "No festivals match your current filter selection.": {
    "hi": "आपके वर्तमान फ़िल्टर चयन से कोई उत्सव मेल नहीं खाता।",
    "mr": "तुमच्या सध्याच्या फिल्टरनुसार कोणताही उत्सव आढळला नाही.",
    "bn": "আপনার বর্তমান ফিল্টারের সাথে কোনো উৎসব মিলছে না।",
    "ta": "உங்கள் தற்போதைய தேர்வுக்கு எந்த திருவிழாவும் பொருந்தவில்லை.",
    "te": "మీ ప్రస్తుత ఫిల్టర్ ఎంపికకు సరిపోలే పండుగలు లేవు.",
    "gu": "તમારી વર્તમાન ફિલ્ટર પસંદગી સાથે કોઈ ઉત્સવ મેળ ખાતો નથી."
},
  "Reset all filters": {
    "hi": "सभी फ़िल्टर रीसेट करें",
    "mr": "सर्व फिल्टर्स रीसेट करा",
    "bn": "সব ফিল্টার রিসেট করুন",
    "ta": "அனைத்து வடிப்பான்களையும் மீட்டமைக்க",
    "te": "అన్ని ఫిల్టర్‌లను రీసెట్ చేయండి",
    "gu": "બધા ફિલ્ટર્સ રીસેટ કરો"
},
  "Coming Soon": {
    "hi": "शीघ्र आ रहा है",
    "mr": "लवकरच येत आहे",
    "bn": "শীঘ্রই আসছে",
    "ta": "விரைவில் வருகிறது",
    "te": "త్వరలో రాబోతోంది",
    "gu": "ટૂંક સમયમાં આવી રહ્યું છે"
},
  "During Your Trip": {
    "hi": "आपकी यात्रा के दौरान",
    "mr": "तुमच्या प्रवासादरम्यान",
    "bn": "আপনার ভ্রমণের সময়",
    "ta": "உங்கள் பயணத்தின் போது",
    "te": "మీ పర్యటన సమయంలో",
    "gu": "તમારી મુસાફરી દરમિયાન"
},
  "Reason:": {
    "hi": "कारण:",
    "mr": "कारण:",
    "bn": "कारण:",
    "ta": "காரணம்:",
    "te": "కారణం:",
    "gu": "કારણ:"
},
  "View Details": {
    "hi": "विवरण देखें",
    "mr": "तपशील पहा",
    "bn": "বিস্তারিত দেখুন",
    "ta": "விவரங்களை காண்க",
    "te": "వివరాలు చూడండి",
    "gu": "વિગતો જુઓ"
},
  "Build Around Event": {
    "hi": "उत्सव आधारित यात्रा बनाएं",
    "mr": "उत्सव आधारित प्रवास आखा",
    "bn": "উৎসব ভিত্তিক ভ্রমণ তৈরি করুন",
    "ta": "திருவிழா அடிப்படையில் பயணம் திட்டமிடு",
    "te": "పండుగ ఆధారంగా యాత్ర ప్లాన్ చేయండి",
    "gu": "ઉત્સવ આધારિત પ્રવાસ બનાવો"
},
  "Date & Proximity Relevance Engine": {
    "hi": "तिथि एवं निकटता प्रासंगिकता इंजन",
    "mr": "तारीख व जवळीक प्रासंगिकता इंजिन",
    "bn": "তারিখ ও নৈকট্য প্রাসঙ্গিকতা ইঞ্জিন",
    "ta": "தேதி & அருகாமை தொடர்பு இயந்திரம்",
    "te": "తేదీ & సామీప్యత ఔచిత్య ఇంజిన్",
    "gu": "તારીખ અને નિકટતા સુસંગતતા એન્જિન"
}
,
  "Details": {
    "hi": "विवरण",
    "mr": "तपशील",
    "bn": "বিস্তারিত",
    "ta": "விவரங்கள்",
    "te": "వివరాలు",
    "gu": "વિગતો"
},
  "Full Page": {
    "hi": "पूरा पृष्ठ",
    "mr": "संपूर्ण पान",
    "bn": "সম্পূর্ণ পৃষ্ঠা",
    "ta": "முழுப் பக்கம்",
    "te": "పూర్తి పేజీ",
    "gu": "સંપૂર્ણ પૃષ્ઠ"
},
  "Day Schedule": {
    "hi": "दैनिक कार्यक्रम",
    "mr": "दैनंदिन वेळापत्रक",
    "bn": "দৈনিক সময়সূচী",
    "ta": "நாள் அட்டவணை",
    "te": "రోజువారీ షెడ్యూల్",
    "gu": "દૈનિક સમયપત્રક"
},
  "Curated highlights and cultural exploration.": {
    "hi": "विशेष रूप से चयनित प्रमुख स्थल और सांस्कृतिक अन्वेषण।",
    "mr": "निवडक प्रमुख आकर्षणे आणि सांस्कृतिक सफर.",
    "bn": "বিশেষভাবে নির্বাচিত প্রধান আকর্ষণ ও সাংস্কৃতিক ভ্রমণ।",
    "ta": "சிறப்பாக தேர்ந்தெடுக்கப்பட்ட இடங்கள் மற்றும் கலாச்சார பயணம்.",
    "te": "ఎంపిక చేసిన ప్రధాన ఆకర్షణలు మరియు సాంస్కృతిక అన్వేషణ.",
    "gu": "ખાસ પસંદ કરેલા મુખ્ય આકર્ષણો અને સાંસ્કૃતિક સફર."
},
  "Regional Culinary Highlight:": {
    "hi": "क्षेत्रीय पारंपरिक व्यंजन:",
    "mr": "प्रादेशिक पारंपरिक खाद्यसंस्कृती:",
    "bn": "আঞ্চলিক ঐতিহ্যবাহী খাবার:",
    "ta": "பிராந்திய பாரம்பரிய உணவு:",
    "te": "ప్రాంతీయ సాంప్రదాయ వంటకం:",
    "gu": "પ્રાદેશિક પરંપરાગત વાનગી:"
},
  "Regional Culinary Highlight": {
    "hi": "क्षेत्रीय पारंपरिक व्यंजन",
    "mr": "प्रादेशिक पारंपरिक खाद्यसंस्कृती",
    "bn": "আঞ্চলিক ঐতিহ্যবাহী খাবার",
    "ta": "பிராந்திய பாரம்பரிய உணவு",
    "te": "ప్రాంతీయ సాంప్రదాయ వంటకం",
    "gu": "પ્રાદેશિક પરંપરાગત વાનગી"
},
  "Road Route Map": {
    "hi": "सड़क मार्ग मानचित्र",
    "mr": "रस्ता मार्ग नकाशा",
    "bn": "সড়ক পথ মানচিত্র",
    "ta": "சாலை வழி வரைபடம்",
    "te": "రోడ్డు మార్గ పటం",
    "gu": "માર્ગ નકશો"
},
  "In-App OSM Routing": {
    "hi": "ऐप में OSM रूटिंग",
    "mr": "अ‍ॅपमध्ये OSM मार्ग",
    "bn": "ইন-অ্যাপ OSM রুট",
    "ta": "பயன்பாட்டில் OSM வழிகாட்டல்",
    "te": "యాప్‌లో OSM రూటింగ్",
    "gu": "એપમાં OSM રૂટિંગ"
},
  "Cost Breakdown & Zero Commission": {
    "hi": "लागत विवरण एवं शून्य कमीशन",
    "mr": "खर्चाचा तपशील व शून्य कमिशन",
    "bn": "খরচের বিবরণ ও শূন্য কমিশন",
    "ta": "செலவு விவரம் & பூஜ்ஜிய கமிஷன்",
    "te": "ఖర్చు వివరాలు & జీరో కమిషన్",
    "gu": "ખર્ચ વિગતો અને શૂન્ય કમિશન"
},
  "Local Experiences & Entry:": {
    "hi": "स्थानीय अनुभव एवं प्रवेश शुल्क:",
    "mr": "स्थानिक अनुभव व प्रवेश शुल्क:",
    "bn": "স্থানীয় অভিজ্ঞতা ও প্রবেশ মূল্য:",
    "ta": "உள்ளூர் அனுபவங்கள் & நுழைவு கட்டணம்:",
    "te": "స్థానిక అనుభవాలు & ప్రవేశ రుసుము:",
    "gu": "સ્થાનિક અનુભવો અને પ્રવેશ ફી:"
},
  "Meals & Regional Food:": {
    "hi": "भोजन एवं क्षेत्रीय व्यंजन:",
    "mr": "जेवण आणि प्रादेशिक खाद्यसंस्कृती:",
    "bn": "আহার ও আঞ্চলিক খাবার:",
    "ta": "உணவு & பிராந்திய உணவு வகைகள்:",
    "te": "భోజనం & ప్రాంతీయ ఆహారం:",
    "gu": "ભોજન અને પ્રાદેશિક વાનગીઓ:"
},
  "Local Green Transport:": {
    "hi": "स्थानीय हरित परिवहन:",
    "mr": "स्थानिक पर्यावरणपूरक वाहतूक:",
    "bn": "স্থানীয় পরিবেশবান্ধব পরিবহন:",
    "ta": "உள்ளூர் பசுமை போக்குவரத்து:",
    "te": "స్థానిక పర్యావరణ రవాణా:",
    "gu": "સ્થાનિક ઇકો પરિવહન:"
},
  "Direct Host Benefit:": {
    "hi": "मेजबान को सीधा लाभ:",
    "mr": "यजमानांना थेट लाभ:",
    "bn": "হোস্টের সরাসরি লাভ:",
    "ta": "ஹோஸ்ட்டிற்கு நேரடி பலன்:",
    "te": "హోస్ట్‌కు ప్రత్యక్ష ప్రయోజనం:",
    "gu": "હોસ્ટને સીધો લાભ:"
},
  "100% via UPI": {
    "hi": "100% यूपीआई द्वारा",
    "mr": "100% यूपीआय द्वारे",
    "bn": "100% ইউপিআই মাধ্যমে",
    "ta": "100% யுபிஐ மூலம்",
    "te": "100% యూపీఐ ద్వారా",
    "gu": "100% યુપીઆઇ દ્વારા"
},
  "Reserve Homestays on Route": {
    "hi": "मार्ग में होमस्टे बुक करें",
    "mr": "मार्गावरील होमस्टे आरक्षित करा",
    "bn": "যাত্রাপথে হোমস্টে বুক করুন",
    "ta": "பயண வழியில் ஹோம்ஸ்டே முன்பதிவு செய்",
    "te": "మార్గంలో హోమ్‌స్టేలను బుక్ చేయండి",
    "gu": "માર્ગ પર હોમસ્ટે બુક કરો"
},
  "Regenerate": {
    "hi": "पुनः बनाएं",
    "mr": "पुन्हा तयार करा",
    "bn": "পুনরায় তৈরি করুন",
    "ta": "மீண்டும் உருவாக்கு",
    "te": "మళ్లీ రూపొందించండి",
    "gu": "ફરીથી બનાવો"
},
  "Done Editing": {
    "hi": "संपादन पूर्ण",
    "mr": "संपादन पूर्ण",
    "bn": "সম্পাদনা সম্পন্ন",
    "ta": "திருத்துதல் முடிந்தது",
    "te": "ఎడిటింగ్ పూర్తయింది",
    "gu": "સંપાદન પૂર્ણ"
},
  "Edit Plan": {
    "hi": "योजना संपादित करें",
    "mr": "प्लॅन संपादित करा",
    "bn": "পরিকল্পনা সম্পাদনা করুন",
    "ta": "திட்டத்தைத் திருத்து",
    "te": "ప్లాన్‌ను సవరించండి",
    "gu": "યોજના સંપાદિત કરો"
},
  "Quick AI Customization Prompts": {
    "hi": "त्वरित एआई अनुकूलन सुझाव",
    "mr": "जलद एआय बदल सूचना",
    "bn": "দ্রুত এআই কাস্টমাইজেশন প্রম্পট",
    "ta": "விரைவான AI மாற்றுக் கட்டளைகள்",
    "te": "శీఘ్ర AI అనుకూలీకరణ సూచనలు",
    "gu": "ઝડપી AI કસ્ટમાઇઝેશન સૂચનો"
},
  "Adjust Duration & Budget": {
    "hi": "अवधि एवं बजट समायोजित करें",
    "mr": "कालावधी व बजेट समायोजित करा",
    "bn": "সময়সীমা ও বাজেট সমন্বয় করুন",
    "ta": "கால அளவு & பட்ஜெட்டை மாற்று",
    "te": "వ్యవధి & బడ్జెట్‌ను సర్దుబాటు చేయండి",
    "gu": "સમયગાળો અને બજેટ ગોઠવો"
},
  "Make it cheaper.": {
    "hi": "इसे अधिक किफायती बनाएं।",
    "mr": "हे अधिक परवडणारे बनवा.",
    "bn": "এটি আরও সাশ্রয়ী করুন।",
    "ta": "இதை மேலும் சிக்கனமாக்குங்கள்.",
    "te": "దీనిని మరింత చౌకగా చేయండి.",
    "gu": "આને વધુ સસ્તું બનાવો."
},
  "Add more local experiences.": {
    "hi": "अधिक स्थानीय अनुभव जोड़ें।",
    "mr": "अधिक स्थानिक अनुभव जोडा.",
    "bn": "আরও স্থানীয় অভিজ্ঞতা যোগ করুন।",
    "ta": "மேலும் உள்ளூர் அனுபவங்களைச் சேர்க்கவும்.",
    "te": "మరిన్ని స్థానిక అనుభవాలను జోడించండి.",
    "gu": "વધુ સ્થાનિક અનુભવો ઉમેરો."
},
  "Remove crowded places.": {
    "hi": "भीड़भाड़ वाले स्थान हटाएं।",
    "mr": "गर्दीची ठिकाणे वगळा.",
    "bn": "ভিড়যুক্ত স্থানগুলো বাদ দিন।",
    "ta": "கூட்டம் அதிகமான இடங்களை நீக்குங்கள்.",
    "te": "రద్దీ ప్రదేశాలను తొలగించండి.",
    "gu": "ભીડવાળી જગ્યાઓ દૂર કરો."
},
  "Weather Alert:": {
    "hi": "मौसम चेतावनी:",
    "mr": "हवामान इशारा:",
    "bn": "আবহাওয়া সতর্কতা:",
    "ta": "வானிலை எச்சரிக்கை:",
    "te": "వాతావరణ హెచ్చరిక:",
    "gu": "હવામાન ચેતવણી:"
},
  "Live Crowd Density": {
    "hi": "लाइव भीड़ घनत्व",
    "mr": "थेट गर्दी घनता",
    "bn": "লাইভ ভিড়ের ঘনত্ব",
    "ta": "நேரலை கூட்ட நெரிசல் அடர்த்தி",
    "te": "లైవ్ రద్దీ సాంద్రత",
    "gu": "લાઇવ ભીડ ઘનતા"
},
  "Optimal Density (Low Crowds)": {
    "hi": "उत्कृष्ट घनत्व (कम भीड़)",
    "mr": "उत्तम घनता (कमी गर्दी)",
    "bn": "অনুকূল ঘনত্ব (কম ভিড়)",
    "ta": "உகந்த அடர்த்தி (குறைந்த கூட்டம்)",
    "te": "సరైన సాంద్రత (తక్కువ రద్దీ)",
    "gu": "શ્રેષ્ઠ ઘનતા (ઓછી ભીડ)"
},
  "Emergency & Safety": {
    "hi": "आपातकालीन एवं सुरक्षा",
    "mr": "आपत्कालीन व सुरक्षा",
    "bn": "জরুরি ও নিরাপত্তা",
    "ta": "அவசரம் & பாதுகாப்பு",
    "te": "అత్యవసర & భద్రత",
    "gu": "કટોકટી અને સલામતી"
},
  "Emergency SOS": {
    "hi": "आपातकालीन एसओएस (SOS)",
    "mr": "आपत्कालीन एसओएस (SOS)",
    "bn": "জরুরি এসওএস (SOS)",
    "ta": "அவசர உதவி (SOS)",
    "te": "అత్యవసర SOS",
    "gu": "કટોકટી SOS"
},
  "Directions (In-App)": {
    "hi": "मार्ग दर्शन (ऐप में)",
    "mr": "दिशा (अ‍ॅपमध्ये)",
    "bn": "দিকনির্দেশ (অ্যাপে)",
    "ta": "வழிகாட்டல் (செயலியில்)",
    "te": "దిశలు (యాప్‌లో)",
    "gu": "દિશાઓ (એપમાં)"
},
  "Visited": {
    "hi": "भ्रमण किया",
    "mr": "भेट दिली",
    "bn": "পরিদর্শন সম্পন্ন",
    "ta": "பார்வையிடப்பட்டது",
    "te": "సందర్శించారు",
    "gu": "મુલાકાત લીધી"
},
  "Check In": {
    "hi": "चेक इन करें",
    "mr": "चेक इन करा",
    "bn": "চেক ইন করুন",
    "ta": "செக்-இன் செய்க",
    "te": "చెక్ ఇన్ చేయండి",
    "gu": "ચેક ઇન કરો"
},
  "Swap": {
    "hi": "बदलें",
    "mr": "बदला",
    "bn": "পরিবর্তন করুন",
    "ta": "மாற்று",
    "te": "మార్చండి",
    "gu": "બદલો"
},
  "Reserve": {
    "hi": "आरक्षित करें",
    "mr": "आरक्षित करा",
    "bn": "সংরক্ষণ করুন",
    "ta": "முன்பதிவு செய்",
    "te": "రిజర్వ్ చేయండి",
    "gu": "અનામત રાખો"
},
  "Imperial Citadels, Living Heritage & Fortified Architecture": {
    "hi": "शाही गढ़, जीवंत धरोहर एवं अभेद्य स्थापत्य",
    "mr": "शाही किल्ले, जिवंत वारसा आणि ऐतिहासिक स्थापत्य",
    "bn": "রাজকীয় দুর্গ, জীবন্ত ঐতিহ্য ও সুরক্ষিত স্থাপত্য",
    "ta": "அரச கோட்டைகள், வாழும் பாரம்பரியம் & அரண்மனை கட்டிடக்கலை",
    "te": "రాచరిక కోటలు, సజీవ వారసత్వం & పటిష్టమైన నిర్మాణాలు",
    "gu": "શાહી કિલ્લાઓ, જીવંત વારસો અને ઐતિહાસિક સ્થાપત્ય"
},
  "Royal Palaces, Living Legends & Archaeological Artifacts": {
    "hi": "राजमहल, अमर गाथाएं एवं पुरातात्विक धरोहर",
    "mr": "राजवाडे, अमर दंतकथा आणि पुरातत्वीय अवशेष",
    "bn": "রাজপ্রাসাদ, ঐতিহাসিক গাথা ও প্রত্নতাত্ত্বিক নিদর্শন",
    "ta": "அரண்மனைகள், வரலாற்று கதைகள் & தொல்பொருள் சான்றுகள்",
    "te": "రాజభవనాలు, చారిత్రక గాథలు & పురావస్తు ఆధారాలు",
    "gu": "રાજમહેલો, અમર વાર્તાઓ અને પુરાતત્વીય અવશેષો"
},
  "Artisan Guilds, Tribal Crafts & Local Culture": {
    "hi": "शिल्पकार संघ, जनजातीय हस्तशिल्प एवं स्थानीय संस्कृति",
    "mr": "कारागीर संस्था, आदिवासी हस्तकला आणि स्थानिक संस्कृती",
    "bn": "কারিগর সংঘ, আদিবাসী হস্তশিল্প ও স্থানীয় সংস্কৃতি",
    "ta": "கைவினைஞர் சங்கங்கள், பழங்குடி கலை & உள்ளூர் கலாச்சாரம்",
    "te": "చేతివృత్తుల సంఘాలు, గిరిజన కళలు & స్థానిక సంస్కృతి",
    "gu": "કારીગર સંઘો, આદિવાસી હસ્તકળા અને સ્થાનિક સંસ્કૃતિ"
},
  "Historic Courtyards, Byways & Folk Traditions": {
    "hi": "ऐतिहासिक प्रांगण, पुरानी गलियां एवं लोक परंपराएं",
    "mr": "ऐतिहासिक वाडे, जुन्या गल्ल्या आणि लोकपरंपरा",
    "bn": "ঐতিহাসিক প্রাঙ্গণ, প্রাচীন গলি ও লোকঐতিহ্য",
    "ta": "வரலாற்று முற்றங்கள், பழங்கால தெருக்கள் & நாட்டுப்புற மரபுகள்",
    "te": "చారిత్రక ప్రాంగణాలు, సందులు & జానపద సంప్రదాయాలు",
    "gu": "ઐતિહાસિક ચોક, જૂની ગલીઓ અને લોકપરંપરાઓ"
},
  "Grand Monuments, Sunset Ramparts & Cultural Reflections": {
    "hi": "भव्य स्मारक, सूर्यास्त प्राचीर एवं सांस्कृतिक आभा",
    "mr": "भव्य स्मारके, सूर्यास्ताचे तट आणि सांस्कृतिक दर्शन",
    "bn": "মহিমান্বিত স্মৃতিস্তম্ভ, সূর্যাস্তের প্রাচীর ও সাংস্কৃতিক ঐতিহ্য",
    "ta": "பிரம்மாண்ட நினைவுச்சின்னங்கள், அந்திப் பொழுதும் கோட்டைச் சுவர்களும் & கலாச்சாரம்",
    "te": "భవ్య స్మారకాలు, సూర్యాస్తమయ ప్రాకారాలు & సాంస్కృతిక ప్రతిబింబాలు",
    "gu": "ભવ્ય સ્મારકો, સૂર્યાસ્ત કોટ અને સાંસ્કૃતિક દર્શન"
},
  "Savoring the Sunset: Cultural Reverence & Reflection": {
    "hi": "सूर्यास्त का आनंद: सांस्कृतिक श्रद्धा एवं आध्यात्मिक चिंतन",
    "mr": "सूर्यास्ताचा आनंद: सांस्कृतिक आदर आणि आत्मचिंतन",
    "bn": "সূর্যাস্তের মুগ্ধতা: সাংস্কৃতিক শ্রদ্ধা ও আত্মউপলব্ধি",
    "ta": "அந்திப் பொழுதின் அழகு: கலாச்சார மரியாதை & சிந்தனை",
    "te": "సూర్యాస్తమయ ఆనందం: సాంస్కృతిక భక్తి & ప్రశాంతత",
    "gu": "સૂર્યાસ્તનો આનંદ: સાંસ્કૃતિક આદર અને શાંતિ"
},
  "Old Bazaar Spice Trails, Street Flavors & Morning Kachori": {
    "hi": "पुराने बाजार के मसाले, लजीज स्वाद एवं सुबह की कचौड़ी",
    "mr": "जुना बाजार मसाले, चवदार पदार्थ आणि सकाळची कचोरी",
    "bn": "পুরনো বাজারের মশলা, সুস্বাদু স্ট্রিট ফুড ও সকালের কচুরি",
    "ta": "பழைய பஜார் மசாலாக்கள், தெருவோர உணவுகள் & காலை கச்சோரி",
    "te": "పాత బజార్ మసాలాలు, వీధి రుచులు & ఉదయపు కచోరీ",
    "gu": "જૂના બજારના મસાલા, સ્વાદિષ્ટ વાનગીઓ અને સવારની કચોરી"
},
  "Royal Heritage Recipes, Sweet Guilds & Traditional Breads": {
    "hi": "शाही पारंपरिक व्यंजन, मिष्ठान्न एवं पारंपरिक रोटियां",
    "mr": "शाही पाककृती, पारंपरिक मिठाई आणि विविध रोट्या",
    "bn": "রাজকীয় ঐতিহ্যবাহী রান্না, মিষ্টি ও সাবেকি রুটি",
    "ta": "அரச பாரம்பரிய சமையல், இனிப்புகள் & பாரம்பரிய உணவுகள்",
    "te": "రాచరిక వంటకాలు, మిఠాయిలు & సాంప్రదాయ రొట్టెలు",
    "gu": "શાહી વાનગીઓ, મિઠાઈઓ અને પરંપરાગત રોટલીઓ"
},
  "Farm-to-Table Village Dining, Local Spices & Evening Tea": {
    "hi": "खेत से थाली तक ग्रामीण भोजन, स्थानीय मसाले एवं सांध्य चाय",
    "mr": "शेतातून थेट ताटात ग्रामीण भोजन, स्थानिक मसाले आणि सायंकाळचा चहा",
    "bn": "ক্ষেত থেকে পাতে গ্রামীণ খাবার, স্থানীয় মশলা ও সান্ধ্যকালীন চা",
    "ta": "பண்ணை முதல் தட்டு வரை கிராமத்து உணவு, உள்ளூர் மசாலா & மாலை தேநீர்",
    "te": "పొలం నుండి నేరుగా పళ్లెంలోకి గ్రామీణ భోజనం, స్థానిక మసాలాలు & సాయంత్రపు టీ",
    "gu": "ખેતરથી થાળી સુધી ગ્રામીણ ભોજન, સ્થાનિક મસાલા અને સાંજની ચા"
},
  "Culinary Delights & Regional Street Food Trails": {
    "hi": "स्वाद का खजाना एवं क्षेत्रीय स्ट्रीट फूड यात्रा",
    "mr": "स्वादिष्ट खाद्यपदार्थ आणि प्रादेशिक स्ट्रीट फूड सफर",
    "bn": "রসনা তৃপ্তি ও আঞ্চলিক স্ট্রিট ফুড ভ্রমণ",
    "ta": "சுவையான உணவுகள் & பிராந்திய தெருவோர உணவுப் பயணம்",
    "te": "రుచికరమైన వంటకాలు & ప్రాంతీయ వీధి ఆహార యాత్ర",
    "gu": "સ્વાદિષ્ટ વાનગીઓ અને પ્રાદેશિક સ્ટ્રીટ ફૂડ સફર"
},
  "Highland Ridge Trek, Alpine Horizons & Mountain Passes": {
    "hi": "पहाड़ी रिज ट्रेक, अल्पाइन क्षितिज एवं पर्वतीय दर्रे",
    "mr": "डोंगराळ रिज ट्रेक, अल्पाइन क्षितिज आणि पर्वतीय खिंडी",
    "bn": "পাহাড়ি রিজ ট্রেক, আলপাইন দিগন্ত ও পর্বত গিরিপথ",
    "ta": "மலைத்தொடர் மலையேற்றம், அல்பைன் எல்லை & மலைக் கணவாய்கள்",
    "te": "పర్వత రిడ్జ్ ట్రెక్, ఆల్పైన్ క్షితిజం & పర్వత కనుమలు",
    "gu": "પહાડી રિજ ટ્રેક, આલ્પાઇન ક્ષિતિજ અને પર્વતીય ઘાટ"
},
  "River Gorges, Rapid Escarpments & Wilderness Discovery": {
    "hi": "नदी की घाटियां, तीव्र ढलान एवं अरण्य अन्वेषण",
    "mr": "नदीचे खोरे, वेगाने वाहणारे प्रवाह आणि वन्य सफर",
    "bn": "নদী উপত্যকা, পাহাড়ি ঢাল ও বন্যপ্রকৃতি অন্বেষণ",
    "ta": "நதிப் பள்ளத்தாக்குகள், செங்குத்தான பாறைகள் & வனவிலங்கு தேடல்",
    "te": "నదీ లోయలు, నిటారుగా ఉండే కొండలు & అడవి అన్వేషణ",
    "gu": "નદીની ખીણો, ઢોળાવ અને વન્યપ્રકૃતિ સફર"
},
  "Rugged Trails, Outdoor Exploration & Panoramic Escapes": {
    "hi": "बीहड़ पगडंडियां, खुली प्रकृति का अन्वेषण एवं विहंगम दृश्य",
    "mr": "कठीण पायवाटा, मैदानी शोध आणि विहंगम निसर्गदर्शन",
    "bn": "পাথুরে পথ, উন্মুক্ত প্রকৃতি অন্বেষণ ও মনোরম নিসর্গ",
    "ta": "கரடுமுரடான பாதைகள், வெளிப்புற பயணம் & அழகிய காட்சிகள்",
    "te": "కఠినమైన దారులు, బాహ్య అన్వేషణ & విస్తృత ప్రకృతి దృశ్యాలు",
    "gu": "પથરાળ કેડીઓ, આઉટડોર સફર અને મનોહર નજારા"
},
  "Exploration & Culture": {
    "hi": "अन्वेषण एवं संस्कृति",
    "mr": "संशोधन आणि संस्कृती",
    "bn": "অনুসন্ধান ও সংস্কৃতি",
    "ta": "ஆராய்ச்சி & கலாச்சாரம்",
    "te": "అన్వేషణ & సంస్కృతి",
    "gu": "અન્વેષણ અને સંસ્કૃતિ"
},
  "Pleasant morning 21°C, warm afternoon 28°C with gentle breezes • Low humidity": {
    "hi": "सुहावनी सुबह 21°C, सुखद दोपहर 28°C संग मंद पवन • कम आर्द्रता",
    "mr": "आल्हाददायक सकाळ 21°C, उबदार दुपार 28°C सोबत मंद वारा • कमी आर्द्रता",
    "bn": "মনোরম সকাল ২১°C, উষ্ণ দুপুর ২৮°C সাথে মৃদু বাতাস • কম আর্দ্রতা",
    "ta": "இதமான காலை 21°C, மிதமான மதியம் 28°C மெல்லிய காற்றுடன் • குறைந்த ஈரப்பதம்",
    "te": "హాయిగా ఉండే ఉదయం 21°C, వెచ్చని మధ్యాహ్నం 28°C తో చల్లని గాలి • తక్కువ తేమ",
    "gu": "આહ્લાદક સવાર 21°C, હૂંફાળી બપોર 28°C સાથે મંદ પવન • ઓછી ભેજ"
},
  "Clear sunny skies, ideal for photography and outdoor walking tours • UV Index 4": {
    "hi": "साफ खिली धूप, फोटोग्राफी और पैदल भ्रमण के लिए उत्तम • यूवी सूचकांक 4",
    "mr": "स्वच्छ सूर्यप्रकाश, छायाचित्रण आणि पायी भ्रमंतीसाठी उत्तम • यूव्ही निर्देशांक 4",
    "bn": "পরিষ্কার রৌদ্রোজ্জ্বল আকাশ, ফটোগ্রাফি ও ভ্রমণের জন্য আদর্শ • UV সূচক ৪",
    "ta": "தெளிவான வெயில், புகைப்படங்கள் மற்றும் நடைபயணத்திற்கு ஏற்றது • UV குறியீடு 4",
    "te": "స్పష్టమైన ఎండ, ఫోటోగ్రఫీ మరియు నడక యాత్రలకు అనుకూలం • UV సూచిక 4",
    "gu": "સ્વચ્છ તડકો, ફોટોગ્રાફી અને ચાલવાની મુસાફરી માટે શ્રેષ્ઠ • યુવી ઇન્ડેક્સ 4"
},
  "Crisp mountain air, evening chill 14°C — carry a light pashmina or jacket": {
    "hi": "ताजा पहाड़ी हवा, शाम की ठंडक 14°C — हल्का शॉल या जैकेट साथ रखें",
    "mr": "ताजी डोंगराळ हवा, संध्याकाळची थंडी 14°C — हलकी शाल किंवा जॅकेट सोबत ठेवा",
    "bn": "সতেজ পাহাড়ি বাতাস, সন্ধ্যার শীতলতা ১৪°C — হালকা শাল বা জ্যাকেট সাথে রাখুন",
    "ta": "புத்துணர்ச்சியூட்டும் மலைக் காற்று, மாலைக் குளிர் 14°C — லேசான சால்வை அல்லது ஜாக்கெட் எடுத்துச் செல்லவும்",
    "te": "స్వచ్ఛమైన పర్వత గాలి, సాయంత్రపు చలి 14°C — తేలికపాటి శాలువా లేదా జాకెట్ తీసుకెళ్లండి",
    "gu": "તાજી પહાડી હવા, સાંજની ઠંડી 14°C — હલકી શાલ અથવા જેકેટ સાથે રાખો"
},
  "Mild and temperate with soothing golden hour lighting • Clear sunset visibility": {
    "hi": "सौम्य एवं सुहावना मौसम, मनमोहक गोधूलि वेला • सूर्यास्त का स्पष्ट दृश्य",
    "mr": "सौम्य आणि आल्हाददायक हवामान, मनमोहक सोनेरी किरणे • सूर्यास्ताचे स्पष्ट दृश्य",
    "bn": "মনোরম আবহাওয়া, স্নিগ্ধ গোধূলি আলো • সূর্যাস্তের স্পষ্ট দৃশ্য",
    "ta": "மிதமான இனிமையான வானிலை, மாலை பொன் நேர வெளிச்சம் • தெளிவான சூரிய அஸ்தமன காட்சி",
    "te": "మితమైన ఆహ్లాదకర వాతావరణం, సాయంత్రపు సుందర కాంతి • స్పష్టమైన సూర్యాస్తమయ దృశ్యం",
    "gu": "સૌમ્ય અને સુખદ વાતાવરણ, મનોહર સંધ્યા પ્રકાશ • સૂર્યાસ્તનું સ્પષ્ટ દ્રશ્ય"
},
  "Visit before 10:30 AM to avoid midday heat and capture photos of the eastern facade with optimal natural lighting.": {
    "hi": "दोपहर की गर्मी से बचने और प्राकृतिक रोशनी में पूर्वी अग्रभाग की उत्कृष्ट तस्वीरें लेने के लिए सुबह 10:30 बजे से पहले जाएं।",
    "mr": "दुपारच्या उन्हापासून वाचण्यासाठी आणि नैसर्गिक प्रकाशात पूर्वेकडील भागाची सुंदर छायाचित्रे काढण्यासाठी सकाळी 10:30 पूर्वी भेट द्या.",
    "bn": "দুপুরের রোদ এড়াতে এবং সর্বোত্তম প্রাকৃতিক আলোয় পূর্ব দিকের ছবি তুলতে সকাল ১০:৩০ এর আগে দর্শন করুন।",
    "ta": "மதிய வெயிலைத் தவிர்க்கவும், இயற்கை ஒளியில் கிழக்கு முகப்பின் சிறந்த படங்களை எடுக்கவும் காலை 10:30 மணிக்கு முன் செல்லவும்.",
    "te": "మధ్యాహ్నపు ఎండను నివారించడానికి మరియు సహజ కాంతిలో తూర్పు ముఖభాగం చిత్రాలను తీయడానికి ఉదయం 10:30 గంటలకు ముందే సందర్శించండి.",
    "gu": "બપોરના તડકાથી બચવા અને કુદરતી પ્રકાશમાં પૂર્વીય ભાગના શ્રેષ્ઠ ફોટા લેવા માટે સવારે 10:30 પહેલાં મુલાકાત લો."
},
  "Support local artisans near the entrance gate where handloom fabrics and GI-tagged pottery are sold at direct zero-middleman prices.": {
    "hi": "प्रवेश द्वार के समीप स्थानीय कारीगरों का सहयोग करें, जहां हथकरघा वस्त्र और जीआई-टैग युक्त मिट्टी के बर्तन बिना बिचौलियों के उचित मूल्य पर मिलते हैं।",
    "mr": "प्रवेशद्वाराजवळ हातमाग कापड आणि जीआय-टॅग असलेली मातीची भांडी थेट रास्त दरात विकणाऱ्या स्थानिक कारागिरांना पाठबळ द्या.",
    "bn": "প্রবেশদ্বারের কাছে স্থানীয় কারিগরদের সমর্থন করুন, যেখানে হ্যান্ডলুম পোশাক ও জিআই-ট্যাগযুক্ত মৃৎশিল্প সরাসরি ন্যায্য মূল্যে বিক্রি হয়।",
    "ta": "நுழைவு வாயில் அருகே உள்ளூர் கைவினைஞர்களுக்கு ஆதரவளியுங்கள், அங்கு கைத்தறி ஆடைகள் மற்றும் புவிசார் குறியீடு பெற்ற மண்பாண்டங்கள் நேரடி விலையில் விற்கப்படுகின்றன.",
    "te": "ప్రవేశ ద్వారం వద్ద చేనేత వస్త్రాలు మరియు జీఐ-ట్యాగ్ ఉన్న మట్టి పాత్రలను నేరుగా విక్రయించే స్థానిక కళాకారులకు మద్దతు ఇవ్వండి.",
    "gu": "પ્રવેશદ્વાર નજીક સ્થાનિક કારીગરોને ટેકો આપો, જ્યાં હાથશાળના વસ્ત્રો અને જીઆઈ-ટેગવાળા માટીના વાસણો વચેટિયા વગર વ્યાજબી ભાવે મળે છે."
},
  "Engage a certified local guide from the TravelSathi network for deep architectural folklore and hidden courtyard passages.": {
    "hi": "गहन स्थापत्य लोककथाओं और छिपे हुए आंगनों के मार्गों के लिए ट्रेवलसाथी नेटवर्क से प्रमाणित स्थानीय गाइड से जुड़ें।",
    "mr": "स्थापत्यशास्त्राच्या समृद्ध कथा आणि गुप्त दालने पाहण्यासाठी ट्रॅव्हलसाथी नेटवर्कवरील प्रमाणित स्थानिक मार्गदर्शकाची मदत घ्या.",
    "bn": "স্থাপত্য লোকগাথা এবং লুকানো প্রাঙ্গণের পথ আবিষ্কার করতে ট্রাভেলসাথী নেটওয়ার্কের প্রত্যয়িত স্থানীয় গাইডের সহায়তা নিন।",
    "ta": "ஆழமான கட்டிடக்கலை கதைகள் மற்றும் மறைக்கப்பட்ட முற்றங்களை அறிய டிராவல்சாதி நெட்வொர்க்கின் சான்றளிக்கப்பட்ட உள்ளூர் வழிகாட்டியை நாடுங்கள்.",
    "te": "నిర్మాణ విశేషాలు మరియు రహస్య ప్రాంగణాల వివరాలు తెలుసుకోవడానికి ట్రావెల్ సాథీ నెట్‌వర్క్ ధృవీకరించిన స్థానిక గైడ్‌ను సంప్రదించండి.",
    "gu": "સ્થાપત્ય લોકકથાઓ અને છુપાયેલા રસ્તાઓ સમજવા માટે ટ્રાવેલસાથી નેટવર્કના પ્રમાણિત સ્થાનિક ગાઇડનો સંપર્ક કરો."
},
  "Try the traditional regional snack at the heritage stall outside the main courtyard for an authentic culinary treat.": {
    "hi": "प्रामाणिक खान-पान के अनुभव के लिए मुख्य प्रांगण के बाहर हेरिटेज स्टॉल पर पारंपरिक क्षेत्रीय नाश्ते का स्वाद अवश्य लें।",
    "mr": "अस्सल चवीचा आस्वाद घेण्यासाठी मुख्य प्रांगणाबाहेरील हेरिटेज स्टॉलवर पारंपारिक प्रादेशिक अल्पोपहार नक्की करून पहा.",
    "bn": "খাঁটি খাবারের অভিজ্ঞতার জন্য প্রধান প্রাঙ্গণের বাইরের ঐতিহ্যবাহী স্টলে আঞ্চলিক মুখরোচক খাবারের স্বাদ নিন।",
    "ta": "உண்மையான பிராந்திய சுவைக்கு முக்கிய முற்றத்திற்கு வெளியே உள்ள பாரம்பரிய கடையில் சிற்றுண்டியை சுவைக்கவும்.",
    "te": "ప్రామాణిక రుచిని ఆస్వాదించడానికి ప్రధాన ప్రాంగణం వెలుపల ఉన్న హెరిటేజ్ స్టాల్‌లో సాంప్రదాయ ప్రాంతీయ అల్పాహారాన్ని రుచి చూడండి.",
    "gu": "અધિકૃત સ્વાદિષ્ટ વાનગીના અનુભવ માટે મુખ્ય પ્રાંગણની બહાર હેરીટેજ સ્ટોલ પર પરંપરાગત નાસ્તાનો સ્વાદ માણો."
},
  "Patliputra Heritage Courtyard Homestay Patna": {
    "hi": "पाटलिपुत्र हेरिटेज कोर्टयार्ड होमस्टे पटना",
    "mr": "पाटलिपुत्र हेरिटेज कोर्टयार्ड होमस्टे पाटणा",
    "bn": "পাটলিপুত্র হেরিটেজ কোর্টইয়ার্ড হোমস্টে পাটনা",
    "ta": "பாடலிபுத்திரா ஹெரிட்டேஜ் கோர்ட்ட்யார்ட் ஹோம்ஸ்டே பாட்னா",
    "te": "పాట్లీపుత్ర హెరిటేజ్ కోర్ట్‌యార్డ్ హోమ్‌స్టే పాట్నా",
    "gu": "પાટલિપુત્ર હેરિટેજ કોર્ટયાર્ડ હોમસ્ટે પટના"
},
  "Charming boutique homestay hosted by a heritage family offering quiet residential suites, leafy garden veranda, home-cooked Bihari cuisine, and airport pick-up. Phone: +91-9835012345.": {
    "hi": "एक प्रतिष्ठित परिवार द्वारा संचालित मनभावन बुटीक होमस्टे, जिसमें शांत सुइट्स, हरा-भरा बगीचा, घर का बना बिहारी भोजन एवं एयरपोर्ट पिकअप की सुविधा है। फोन: +91-9835012345।",
    "mr": "एका खानदानी कुटुंबातर्फे चालवले जाणारे सुंदर बुटीक होमस्टे, शांत खोल्या, हिरवेगार अंगण, घरगुती बिहारी जेवण आणि विमानतळ पिकअप सुविधा. फोन: +91-9835012345.",
    "bn": "একটি ঐতিহ্যবাহী পরিবার দ্বারা পরিচালিত মনোরম বুটিক হোমস্টে, শান্ত স্যুট, সবুজ বাগান বারান্দা, ঘরে তৈরি বিহারি খাবার ও বিমানবন্দর পিকআপ সুবিধা। ফোন: +৯১-৯৮৩৫০১২৩৪৫।",
    "ta": "பாரம்பரிய குடும்பத்தால் நடத்தப்படும் அமைதியான சூட்கள், பசுமையான தோட்டம், சுவையான பிஹாரி வீட்டு உணவு மற்றும் விமான நிலைய பிக்கப் வசதியுடன் கூடிய ஹோம்ஸ்டே. தொலைபேசி: +91-9835012345.",
    "te": "సాంప్రదాయ కుటుంబంచే నిర్వహించబడే ప్రశాంతమైన సూట్లు, పచ్చని తోట వరండా, ఇంట్లో వండిన బిహారీ వంటకాలు మరియు ఎయిర్‌పోర్ట్ పికప్ సదుపాయం గల హోమ్‌స్టే. ఫోన్: +91-9835012345.",
    "gu": "એક પ્રતિષ્ઠિત પરિવાર દ્વારા સંચાલિત સુંદર બુટિક હોમસ્ટે, જેમાં શાંત સ્યુટ્સ, હરિયાળો બગીચો, ઘરનું બનાવેલું બિહારી ભોજન અને એરપોર્ટ પિકઅપ ઉપલબ્ધ છે. ફોન: +91-9835012345."
},
  "Bikanervala & Pind Balluchi Revolving Restaurant Patna": {
    "hi": "बीकानेरवाला एवं पिंड बलूची रिवॉल्विंग रेस्तरां पटना",
    "mr": "बिकानेरवाला आणि पिंड बल्लुची रिव्हॉल्व्हिंग रेस्टॉरंट पाटणा",
    "bn": "বিকানেরওয়ালা ও পিন্ড বালুচি রিভলভিং রেস্তোরাঁ পাটনা",
    "ta": "பிகானேர்வாலா & பிண்ட் பலூச்சி ரிவால்விங் உணவகம் பாட்னா",
    "te": "బికానేర్‌వాలా & పిండ్ బల్లూచి రివాల్వింగ్ రెస్టారెంట్ పాట్నా",
    "gu": "બિકાનેરવાલા અને પિંડ બલ્લૂચી રિવોલ્વિંગ રેસ્ટોરન્ટ પટના"
},
  "Panoromic revolving restaurant located atop Biscomaun Bhawan offering 360-degree skyline views of the Ganges River along with Punjabi and North Indian culinary delights. Phone: 0612-2219900.": {
    "hi": "बिस्कोमान भवन की शीर्ष मंजिल पर स्थित 360-डिग्री घूमने वाला रेस्तरां, जहां से गंगा नदी का विहंगम दृश्य और स्वादिष्ट पंजाबी व उत्तर भारतीय व्यंजन मिलते हैं। फोन: 0612-2219900।",
    "mr": "बिस्कोमान भवनच्या छतावर असलेले ३६०-डिग्री फिरणारे रेस्टॉरंट, जिथून गंगा नदीचे नयनरम्य दृश्य आणि चवदार पंजाबी व उत्तर भारतीय जेवण मिळते. फोन: 0612-2219900.",
    "bn": "বিসকোমান ভবনের শীর্ষে অবস্থিত ৩৬০-ডিগ্রি ঘূর্ণায়মান রেস্তোরাঁ, যেখান থেকে গঙ্গা নদীর মনোরম দৃশ্য এবং সুস্বাদু পাঞ্জাবি ও উত্তর ভারতীয় খাবার উপভোগ করা যায়। ফোন: ০৬১২-২২১৯৯০০।",
    "ta": "பிஸ்கோமான் பவனின் மேல் தளத்தில் அமைந்துள்ள 360-டிகிரி சுழலும் உணவகம், கங்கை நதியின் அழகு மற்றும் சுவையான பஞ்சாபி & வட இந்திய உணவுகளை வழங்குகிறது. தொலைபேசி: 0612-2219900.",
    "te": "బిస్కోమాన్ భవన్ పై అంతస్తులో ఉన్న 360-డిగ్రీల తిరిగే రెస్టారెంట్, గంగా నది సుందర దృశ్యాలు మరియు రుచికరమైన పంజాబీ & ఉత్తర భారతీయ వంటకాలను అందిస్తుంది. ఫోన్: 0612-2219900.",
    "gu": "બિસ્કોમાન ભવનના ટોચના માળે આવેલી ૩૬૦-ડિગ્રી ફરતી રેસ્ટોરન્ટ, જ્યાંથી ગંગા નદીનો મનોહર નજારો અને સ્વાદિષ્ટ પંજાબી અને ઉત્તર ભારતીય ભોજન મળે છે. ફોન: 0612-2219900."
}
};

/**
 * Universal text translation helper
 */
export function translateText(text: string, lang: string = 'en'): string {
  if (!text) return '';
  const l = (lang || 'en').toLowerCase().trim();
  if (l === 'en') return text;

  // Direct phrase match
  const trimmed = text.trim();
  if (PHRASE_DICTIONARY[trimmed]?.[l]) {
    return PHRASE_DICTIONARY[trimmed][l];
  }

  // "X km to venue" pattern
  const venueKmMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*km to venue$/i);
  if (venueKmMatch) {
    const dist = venueKmMatch[1];
    switch (l) {
      case 'hi': return `${dist} किमी आयोजन स्थल से`;
      case 'mr': return `${dist} किमी कार्यक्रम स्थळापासून`;
      case 'bn': return `${dist} কিমি উৎসব প্রাঙ্গণ থেকে`;
      case 'ta': return `${dist} கிமீ விழா அரங்கிலிருந்து`;
      case 'te': return `${dist} కి.మీ వేదిక నుండి`;
      case 'gu': return `${dist} કિમી ઉત્સવ સ્થળથી`;
    }
  }

  // "X km away" pattern
  const kmMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*km away$/i);
  if (kmMatch) {
    const dist = kmMatch[1];
    switch (l) {
      case 'hi': return `${dist} किमी दूर`;
      case 'mr': return `${dist} किमी अंतरावर`;
      case 'bn': return `${dist} কিমি দূরে`;
      case 'ta': return `${dist} கிமீ தொலைவில்`;
      case 'te': return `${dist} కి.మీ దూరంలో`;
      case 'gu': return `${dist} કિમી દૂર`;
    }
  }

  // "X CONFIDENCE" pattern
  const confMatch = trimmed.match(/^(HIGH|MODERATE|LOW)\s*CONFIDENCE$/i);
  if (confMatch) {
    const level = confMatch[1].toUpperCase();
    const lvlTrans = translateText(level, l);
    switch (l) {
      case 'hi': return `${lvlTrans} विश्वसनीयता`;
      case 'mr': return `${lvlTrans} विश्वासार्हता`;
      case 'bn': return `${lvlTrans} নির্ভরযোগ্যতা`;
      case 'ta': return `${lvlTrans} நம்பிக்கை`;
      case 'te': return `${lvlTrans} విశ్వసనీయత`;
      case 'gu': return `${lvlTrans} વિશ્વસનીયતા`;
    }
  }

  // Nearest railway station pattern
  if (trimmed.startsWith('Nearest station:')) {
    const stn = trimmed.replace('Nearest station:', '').trim();
    switch (l) {
      case 'hi': return `निकटतम स्टेशन: ${stn}`;
      case 'mr': return `जवळचे स्थानक: ${stn}`;
      case 'bn': return `নিকটতম স্টেশন: ${stn}`;
      case 'ta': return `அருகிலுள்ள நிலையம்: ${stn}`;
      case 'te': return `సమీప స్టేషన్: ${stn}`;
      case 'gu': return `નજીકનું સ્ટેશન: ${stn}`;
    }
  }

  // Nearest airport pattern
  if (trimmed.startsWith('Nearest airport:')) {
    const apt = trimmed.replace('Nearest airport:', '').trim();
    switch (l) {
      case 'hi': return `निकटतम हवाई अड्डा: ${apt}`;
      case 'mr': return `जवळचे विमानतळ: ${apt}`;
      case 'bn': return `নিকটতম বিমানবন্দর: ${apt}`;
      case 'ta': return `அருகிலுள்ள விமான நிலையம்: ${apt}`;
      case 'te': return `సమీప విమానాశ్రయం: ${apt}`;
      case 'gu': return `નજીકનું એરપોર્ટ: ${apt}`;
    }
  }

  // "X Hours" or "X Hour" pattern with decimals
  const hrMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*Hours?$/i);
  if (hrMatch) {
    const hrs = hrMatch[1];
    switch (l) {
      case 'hi': return `${hrs} घंटे`;
      case 'mr': return `${hrs} तास`;
      case 'bn': return `${hrs} ঘণ্টা`;
      case 'ta': return `${hrs} மணிநேரம்`;
      case 'te': return `${hrs} గంటలు`;
      case 'gu': return `${hrs} કલાક`;
    }
  }

  // "X crowd density" pattern (e.g., "Low (Quiet Hours) crowd density")
  const crowdDensityMatch = trimmed.match(/^(.*?)\s*crowd density$/i);
  if (crowdDensityMatch) {
    const inner = translateText(crowdDensityMatch[1], l);
    switch (l) {
      case 'hi': return `${inner} भीड़ घनत्व`;
      case 'mr': return `${inner} गर्दी घनता`;
      case 'bn': return `${inner} ভিড়ের ঘনত্ব`;
      case 'ta': return `${inner} கூட்ட நெரிசல் அடர்த்தி`;
      case 'te': return `${inner} రద్దీ సాంద్రత`;
      case 'gu': return `${inner} ભીડ ઘનતા`;
    }
  }

  // Crowd level badges
  if (/^Low\s*\((?:Quiet Hours|Shaded Times?)\)$/i.test(trimmed)) {
    switch (l) {
      case 'hi': return 'कम (शांत समय)';
      case 'mr': return 'कमी (शांत वेळ)';
      case 'bn': return 'কম (শান্ত সময়)';
      case 'ta': return 'குறைவு (அமைதியான நேரம்)';
      case 'te': return 'తక్కువ (ప్రశాంత సమయం)';
      case 'gu': return 'ઓછું (શાંત સમય)';
    }
  }
  if (/^Moderate\s*\((?:Clear Sun|Normal|Indoor Comfort|Golden Twilight)\)$/i.test(trimmed)) {
    switch (l) {
      case 'hi': return 'मध्यम (अनुकूल समय)';
      case 'mr': return 'मध्यम (अनुकूल वेळ)';
      case 'bn': return 'মাঝারি (অনুকূল সময়)';
      case 'ta': return 'மிதமான (ஏதுவான நேரம்)';
      case 'te': return 'మితమైన (అనుకూల సమయం)';
      case 'gu': return 'મધ્યમ (અનુકૂળ સમય)';
    }
  }
  if (/^Peak\s*\((?:Vibrant Energy|Peak Hours)\)$/i.test(trimmed)) {
    switch (l) {
      case 'hi': return 'चरम (ऊर्जावान माहौल)';
      case 'mr': return 'जास्त (उत्साही वातावरण)';
      case 'bn': return 'সর্বোচ্চ (প্রাণবন্ত পরিবেশ)';
      case 'ta': return 'அதிகம் (துடிப்பான சூழல்)';
      case 'te': return 'ఎక్కువ (ఉత్సాహభరిత సమయం)';
      case 'gu': return 'વધારે (ઉત્સાહી વાતાવરણ)';
    }
  }

  // Time slot matching (e.g., "Early Morning (08:00 - 10:00)", "Mid-Morning (10:15 - 12:30)")
  const timeSlotMatch = trimmed.match(/^(EARLY MORNING|MID-MORNING|MIDDAY & LUNCH|MIDDAY|AFTERNOON|SUNSET VANTAGE|SUNSET & EVENING|EVENING TWILIGHT|EVENING|NIGHT & DINNER|NIGHT|MORNING)\s*(?:\((.*?)\))?$/i);
  if (timeSlotMatch) {
    const slot = timeSlotMatch[1].toUpperCase();
    const time = timeSlotMatch[2] ? ` (${timeSlotMatch[2]})` : '';
    let slotTrans = slot;
    switch (slot) {
      case 'EARLY MORNING':
        slotTrans = l === 'hi' ? 'सुबह-सवेरे' : l === 'mr' ? 'पहाट / सकाळ' : l === 'bn' ? 'ভোরবেলা' : l === 'ta' ? 'அதிகாலை' : l === 'te' ? 'వేకువజామున' : 'વહેલી સવારે';
        break;
      case 'MID-MORNING':
        slotTrans = l === 'hi' ? 'पूर्वाह्न' : l === 'mr' ? 'सकाळ' : l === 'bn' ? 'সকালবেলা' : l === 'ta' ? 'முற்பகல்' : l === 'te' ? 'ఉదయం' : 'સવાર';
        break;
      case 'MIDDAY & LUNCH':
        slotTrans = l === 'hi' ? 'दोपहर एवं भोजन' : l === 'mr' ? 'दुपार आणि जेवण' : l === 'bn' ? 'দুপুর ও মধ্যাহ্নভোজ' : l === 'ta' ? 'மதியம் & மதிய உணவு' : l === 'te' ? 'మధ్యాహ్నం & భోజనం' : 'બપોર અને ભોજન';
        break;
      case 'MIDDAY':
        slotTrans = l === 'hi' ? 'दोपहर' : l === 'mr' ? 'दुपार' : l === 'bn' ? 'দুপুর' : l === 'ta' ? 'மதியம்' : l === 'te' ? 'మధ్యాహ్నం' : 'બપોર';
        break;
      case 'AFTERNOON':
        slotTrans = l === 'hi' ? 'अपराह्न' : l === 'mr' ? 'दुपारनंतर' : l === 'bn' ? 'অপরাহ্ন' : l === 'ta' ? 'பிற்பகல்' : l === 'te' ? 'మధ్యాహ్నం' : 'બપોર પછી';
        break;
      case 'SUNSET VANTAGE':
      case 'SUNSET & EVENING':
        slotTrans = l === 'hi' ? 'सूर्यास्त एवं सांध्यकाल' : l === 'mr' ? 'सूर्यास्त आणि संध्याकाळ' : l === 'bn' ? 'সূর্যাস্ত ও সন্ধ্যা' : l === 'ta' ? 'சூரிய அஸ்தமனம் & மாலை' : l === 'te' ? 'సూర్యాస్తమయం & సాయంత్రం' : 'સૂર્યાસ્ત અને સાંજ';
        break;
      case 'EVENING TWILIGHT':
      case 'EVENING':
        slotTrans = l === 'hi' ? 'शाम एवं गोधूलि' : l === 'mr' ? 'संध्याकाळ' : l === 'bn' ? 'সন্ধ্যা' : l === 'ta' ? 'மாலை' : l === 'te' ? 'సాయంత్రం' : 'સાંજ';
        break;
      case 'NIGHT & DINNER':
        slotTrans = l === 'hi' ? 'रात्रि एवं रात्रिभोज' : l === 'mr' ? 'रात्र आणि रात्रीचे जेवण' : l === 'bn' ? 'রাত ও নৈশভোজ' : l === 'ta' ? 'இரவு & இரவு உணவு' : l === 'te' ? 'రాత్రి & రాత్రి భోజనం' : 'રાત્રિ અને રાત્રિભોજન';
        break;
      case 'NIGHT':
        slotTrans = l === 'hi' ? 'रात' : l === 'mr' ? 'रात्र' : l === 'bn' ? 'রাত' : l === 'ta' ? 'இரவு' : l === 'te' ? 'రాత్రి' : 'રાત';
        break;
      case 'MORNING':
        slotTrans = l === 'hi' ? 'सुबह' : l === 'mr' ? 'सकाळ' : l === 'bn' ? 'সকাল' : l === 'ta' ? 'காலை' : l === 'te' ? 'ఉదయం' : 'સવાર';
        break;
    }
    return `${slotTrans}${time}`;
  }


  // "Certified Tour Guide (CODE)" pattern
  const guideMatch = trimmed.match(/^Certified Tour Guide\s*\((.*?)\)$/i);
  if (guideMatch) {
    const code = guideMatch[1];
    switch (l) {
      case 'hi': return `प्रमाणित टूर गाइड (${code})`;
      case 'mr': return `प्रमाणित टूर मार्गदर्शक (${code})`;
      case 'bn': return `প্রত্যয়িত ট্যুর গাইড (${code})`;
      case 'ta': return `சான்றளிக்கப்பட்ட வழிகாட்டி (${code})`;
      case 'te': return `ధృవీకరించబడిన టూర్ గైడ్ (${code})`;
      case 'gu': return `પ્રમાણિત ટૂર ગાઇડ (${code})`;
    }
  }

  // "Live (TIME)" pattern
  const liveMatch = trimmed.match(/^Live\s*\((.*?)\)$/i);
  if (liveMatch) {
    const time = liveMatch[1];
    switch (l) {
      case 'hi': return `लाइव (${time})`;
      case 'mr': return `थेट (${time})`;
      case 'bn': return `লাইভ (${time})`;
      case 'ta': return `நேரலை (${time})`;
      case 'te': return `లైవ్ (${time})`;
      case 'gu': return `લાઇવ (${time})`;
    }
  }

  // "Today TIME" pattern
  const todayMatch = trimmed.match(/^Today\s+(.*)$/i);
  if (todayMatch) {
    const time = todayMatch[1];
    switch (l) {
      case 'hi': return `आज ${time}`;
      case 'mr': return `आज ${time}`;
      case 'bn': return `আজ ${time}`;
      case 'ta': return `இன்று ${time}`;
      case 'te': return `ఈరోజు ${time}`;
      case 'gu': return `આજે ${time}`;
    }
  }

  // "Source: XYZ" pattern
  if (trimmed.startsWith('Source:')) {
    const src = trimmed.replace('Source:', '').trim();
    const translatedSrc = translateText(src, l);
    switch (l) {
      case 'hi': return `स्रोत: ${translatedSrc}`;
      case 'mr': return `स्रोत: ${translatedSrc}`;
      case 'bn': return `উৎস: ${translatedSrc}`;
      case 'ta': return `ஆதாரம்: ${translatedSrc}`;
      case 'te': return `మూలం: ${translatedSrc}`;
      case 'gu': return `સ્ત્રોત: ${translatedSrc}`;
    }
  }

  // Comma-separated items (e.g. food, crafts, activities)
  if (trimmed.includes(',') && !trimmed.includes('.')) {
    const parts = trimmed.split(',').map(s => s.trim());
    let anyChanged = false;
    const translatedParts = parts.map(p => {
      const tp = translateText(p, l);
      if (tp !== p) anyChanged = true;
      return tp;
    });
    if (anyChanged) {
      return translatedParts.join(', ');
    }
  }

  // Dynamic experience description pattern
  if (trimmed.startsWith('Immersive, eco-conscious regional experience led by')) {
    const guideName = trimmed.replace('Immersive, eco-conscious regional experience led by', '').split(',')[0].trim();
    switch (l) {
      case 'hi':
        return `प्रमाणित स्थानीय गाइड ${guideName} द्वारा संचालित गहन, पर्यावरण-अनुकूल प्रामाणिक क्षेत्रीय अनुभव। स्थानीय संस्कृति और पारंपरिक जीवनशैली की प्रत्यक्ष अनुभूति।`;
      case 'mr':
        return `प्रमाणित स्थानिक मार्गदर्शक ${guideName} यांच्या नेतृत्वाखालील पर्यावरणपूरक अस्सल प्रादेशिक अनुभव. स्थानिक जीवनशैलीची थेट अनुभूती.`;
      case 'bn':
        return `প্রত্যয়িত স্থানীয় গাইড ${guideName}-এর পরিচালনায় পরিবেশবান্ধব খাঁটি আঞ্চলিক অভিজ্ঞতা। স্থানীয় সংস্কৃতি ও ঐতিহ্যের প্রত্যক্ষ দর্শন।`;
      case 'ta':
        return `சான்றளிக்கப்பட்ட உள்ளூர் வழிகாட்டி ${guideName} வழங்கும் உண்மையான பிராந்திய கலாச்சார மற்றும் இயற்கை அனுபவம்.`;
      case 'te':
        return `ధృవీకరించబడిన స్థానిక గైడ్ ${guideName} ఆధ్వర్యంలో పర్యావరణ అనుకూల ప్రామాణిక ప్రాంతీయ అనుభవం.`;
      case 'gu':
        return `પ્રમાણિત સ્થાનિક માર્ગદર્શક ${guideName} દ્વારા સંચાલિત ઇકો-ફ્રેન્ડલી અધિકૃત પ્રાદેશિક અનુભવ.`;
    }
  }

  // Generic Landmark pattern
  if (trimmed.includes('historical and architectural landmark')) {
    switch (l) {
      case 'hi': return 'समृद्ध ऐतिहासिक विरासत और बारीक नक्काशीदार स्थापत्य का एक अद्वितीय सांस्कृतिक स्थल।';
      case 'mr': return 'समृद्ध ऐतिहासिक वारसा आणि वैशिष्ट्यपूर्ण स्थापत्याचा एक अद्वितीय सांस्कृतिक ठेवा.';
      case 'bn': return 'সমৃদ্ধ ঐতিহাসিক ঐতিহ্য এবং সূক্ষ্ম স্থাপত্যের এক অনন্য সাংস্কৃতিক নিদর্শন।';
      case 'ta': return 'செழுமையான வரலாற்று பாரம்பரியம் மற்றும் நுட்பமான கட்டிடக்கலையின் தனித்துவமான சின்னம்.';
      case 'te': return 'ఘనమైన చారిత్రక వారసత్వం మరియు కళాత్మక నిర్మాణ శైలి కలిగిన విశిష్ట ప్రదేశం.';
      case 'gu': return 'સમૃદ્ધ ઐતિહાસિક વારસો અને બારીક કોતરણીકામ ધરાવતું એક અનન્ય સાંસ્કૃતિક સ્થળ.';
    }
  }

  // Generic Homestay pattern
  if (trimmed.toLowerCase().includes('boutique homestay') || trimmed.toLowerCase().includes('homestay hosted by')) {
    switch (l) {
      case 'hi': return 'एक सम्मानित स्थानीय परिवार द्वारा संचालित मनभावन हेरिटेज होमस्टे, शांत वातावरण, पारंपरिक आतिथ्य एवं प्रामाणिक घर का स्वादिष्ट भोजन।';
      case 'mr': return 'स्थानिक कुटुंबातर्फे चालवले जाणारे सुंदर होमस्टे, शांत परिसर, पारंपारिक आदरातिथ्य आणि घरगुती स्वादिष्ट जेवण.';
      case 'bn': return 'স্থানীয় পরিবারের আন্তরিক পরিচালনায় মনোরম হোমস্টে, শান্ত পরিবেশ, ঐতিহ্যবাহী আতিথেয়তা ও সুস্বাদু ঘরের খাবার।';
      case 'ta': return 'உள்ளூர் குடும்பத்தின் அன்பான விருந்தோம்பல், அமைதியான சூழல் மற்றும் பாரம்பரிய சுவையான உணவுடன் கூடிய ஹோம்ஸ்டே.';
      case 'te': return 'స్థానిక కుటుంబం నిర్వహించే సాంప్రదాయ హోమ్‌స్టే, ఆహ్లాదకరమైన వాతావరణం మరియు ఇంట్లో వండిన రుచికరమైన భోజనం.';
      case 'gu': return 'સ્થાનિક પરિવાર દ્વારા સંચાલિત સુંદર હોમસ્ટે, શાંત વાતાવરણ, પારંપરિક આતિથ્ય અને ઘરનું સ્વાદિષ્ટ ભોજન.';
    }
  }

  // Generic Restaurant pattern
  if (trimmed.toLowerCase().includes('revolving restaurant') || trimmed.toLowerCase().includes('culinary delights') || trimmed.toLowerCase().includes('panoramic revolving')) {
    switch (l) {
      case 'hi': return 'विहंगम नजारों के साथ प्रसिद्ध भोजन स्थल, जहां उत्तर भारतीय एवं पारंपरिक स्थानीय व्यंजनों का उत्तम स्वाद मिलता है।';
      case 'mr': return 'मनोहर दृश्यांसह लोकप्रिय उपहारगृह, जिथे अस्सल प्रादेशिक आणि उत्तर भारतीय स्वादिष्ट जेवण मिळते.';
      case 'bn': return 'অনুপম প্রাকৃতিক দৃশ্য সহ জনপ্রিয় রেস্তোরাঁ, যেখানে ঐতিহ্যবাহী আঞ্চলিক ও উত্তর ভারতীয় সুস্বাদু খাবারের আয়োজন রয়েছে।';
      case 'ta': return 'அழகிய காட்சிகளுடன் கூடிய உணவகம், இங்கு சுவையான பாரம்பரிய மற்றும் வட இந்திய உணவுகள் கிடைக்கின்றன.';
      case 'te': return 'అద్భుతమైన వీక్షణలతో కూడిన ప్రసిద్ధ రెస్టారెంట్, ఇక్కడ ప్రామాణిక ప్రాంతీయ మరియు ఉత్తర భారతీయ వంటకాలు లభిస్తాయి.';
      case 'gu': return 'મનોહર નજારા સાથે પ્રખ્યાત રેસ્ટોરન્ટ, જ્યાં ઉત્તર ભારતીય અને સ્વાદિષ્ટ પ્રાદેશિક વાનગીઓ પીરસવામાં આવે છે.';
    }
  }

  return text;
}

export interface EventContext {
  event_name?: string;
  city?: string;
  state?: string;
  event_category?: string;
  fieldType?: 'description' | 'historical' | 'cultural' | 'activity' | 'food' | 'craft' | 'etiquette' | 'transit' | 'footfall';
}

/**
 * Localizes an Event's dynamic text fields
 */
export function getLocalizedEventField(
  fieldValue: string,
  lang: string = 'en',
  fallback: string = '',
  eventContext?: EventContext
): string {
  if (!fieldValue) return fallback;
  const l = (lang || 'en').toLowerCase().trim();
  if (l === 'en') return fieldValue;

  const direct = translateText(fieldValue, l);
  if (direct && direct !== fieldValue) {
    return direct;
  }

  // If text is not directly found in dictionary, generate authentic culturally grounded Indic text
  const name = eventContext?.event_name ? translateText(eventContext.event_name, l) : 'यह उत्सव';
  const city = eventContext?.city ? translateText(eventContext.city, l) : '';
  const state = eventContext?.state ? translateText(eventContext.state, l) : '';
  const location = city && state ? `${city}, ${state}` : (city || state || 'भारत');
  const cat = eventContext?.event_category ? getLocalizedCategory(eventContext.event_category, l) : 'सांस्कृतिक';

  if (eventContext?.fieldType === 'description') {
    switch (l) {
      case 'hi':
        return `${name} ${location} में आयोजित एक सुप्रसिद्ध ${cat} उत्सव है। यह पर्व समृद्ध सांस्कृतिक विरासत, भक्तिमय परंपराओं, पारंपरिक संगीत और सामुदायिक सौहार्द का एक भव्य प्रदर्शन करता है, जिसमें देश-विदेश से श्रद्धालु और पर्यटक सम्मिलित होते हैं।`;
      case 'mr':
        return `${name} हा ${location} मधील एक अत्यंत नामांकित ${cat} उत्सव आहे. समृद्ध सांस्कृतिक वारसा, पारंपारिक लोककला, वाद्यांचे वादन आणि सामाजिक ऐक्याचे दर्शन घडवणारा हा एक भव्य सोहळा आहे.`;
      case 'bn':
        return `${name} হল ${location}-এর একটি অত্যন্ত প্রসিদ্ধ ${cat} উৎসব। সমৃদ্ধ সাংস্কৃতিক ঐতিহ্য, ঐতিহ্যবাহী লোকসঙ্গীত, আনন্দঘন আচার-অনুষ্ঠান এবং গভীর সামাজিক সম্প্রীতির সাথে এটি উদযাপিত হয়।`;
      case 'ta':
        return `${name} என்பது ${location} பகுதியில் கொண்டாடப்படும் ஒரு புகழ்பெற்ற ${cat} திருவிழா ஆகும். பிராந்திய பாரம்பரியம், நாட்டுப்புறக் கலைகள் மற்றும் ஆன்மீக பக்தி பரவசத்தை இது பறைசாற்றுகிறது.`;
      case 'te':
        return `${name} అనేది ${location}లో నిర్వహించబడే అత్యంత ప్రసిద్ధ ${cat} పండుగ. గొప్ప సంస్కృతి, సంప్రదాయ కళలు, సంగీతం మరియు ప్రజా ఐక్యతను చాటిచెప్పే అద్భుతమైన ఉత్సవం ఇది.`;
      case 'gu':
        return `${name} એ ${location} નો એક સુપ્રસિદ્ધ ${cat} મહોત્સવ છે. ભવ્ય સાંસ્કૃતિક વારસો, લોકકલા, પરંપરાગત સંગીત અને સામુદાયિક એકતાની અનુભૂતિ કરાવતો આ એક અત્યંત લોકપ્રિય ઉત્સવ છે.`;
    }
  }

  if (eventContext?.fieldType === 'historical') {
    switch (l) {
      case 'hi':
        return `${name} सदियों पुरानी ऐतिहासिक परंपराओं और क्षेत्रीय आस्था से जुड़ा हुआ है। यह इस क्षेत्र के समृद्ध इतिहास, प्राचीन गाथाओं और सांस्कृतिक पहचान का एक अविभाज्य अंग रहा है।`;
      case 'mr':
        return `${name} हा शतकानुशतके जुन्या ऐतिहासिक परंपरांशी आणि प्रादेशिक संस्कृतीशी जोडलेला आहे. या प्रांताच्या गौरवशाली इतिहासाचे आणि पूर्वजांच्या समृद्ध परंपरेचे हे एक जिवंत प्रतीक आहे.`;
      case 'bn':
        return `${name}-এর শিকড় বহু শতাব্দীর প্রাচীন ইতিহাস এবং আঞ্চলিক ঐতিহ্যের সাথে গভীরভাবে জড়িত। এই অঞ্চলের সমৃদ্ধ ইতিহাস, রাজকীয় ঐতিহ্য এবং সাংস্কৃতিক আত্মপরিচয়ের এটি এক অনন্য নিদর্শন।`;
      case 'ta':
        return `${name} பல நூற்றாண்டுகள் பழமையான வரலாற்று பாரம்பரியம் மற்றும் பிராந்திய நம்பிக்கைகளுடன் தொடர்புடையது. இப்பகுதியின் கலாச்சார அடையாளத்தில் இது ஒரு அழியாத முத்திரையை பதித்துள்ளது.`;
      case 'te':
        return `${name} శతాబ్దాల నాటి చారిత్రక ప్రాముఖ్యతను మరియు ప్రాంతీయ విశ్వాసాలను కలిగి ఉంది. ఈ ప్రాంత సంస్కృతి, ప్రాచీన సంప్రదాయాలు మరియు చారిత్రక గుర్తింపులో ఇది కీలక స్థానాన్ని ఆక్రమించింది.`;
      case 'gu':
        return `${name} સદીઓ જૂની ઐતિહાસિક પરંપરાઓ અને પ્રાદેશિક માન્યતાઓ સાથે જોડાયેલ છે. આ વિસ્તારના સમૃદ્ધ ઇતિહાસ અને સાંસ્કૃતિક ઓળખનું તે એક જીવંત પ્રતીક છે.`;
    }
  }

  if (eventContext?.fieldType === 'cultural') {
    switch (l) {
      case 'hi':
        return `यह उत्सव सामाजिक समरसता, पारंपरिक लोक कलाओं, हस्तशिल्प और स्थानीय खान-पान की समृद्ध धरोहर को संजोए हुए सभी समुदायों को एक सूत्र में पिरोता है।`;
      case 'mr':
        return `हा उत्सव सामाजिक सलोखा, लोककला, हस्तकला आणि पारंपरिक खाद्यसंस्कृतीचा समृद्ध वारसा जपत सर्व समाजाला एकत्र आणतो.`;
      case 'bn':
        return `এই উৎসব সর্বজনীন সম্প্রীতি, লোকশিল্প, হস্তশিল্প এবং সমৃদ্ধ বাঙালি রসনা ঐতিহ্যকে লালন করে সকল মানুষকে মিলনের বন্ধনে আবদ্ধ করে।`;
      case 'ta':
        return `இந்த திருவிழா சமூக நல்லிணக்கம், பாரம்பரிய கலைகள், கைவினைப் பொருட்கள் மற்றும் கலாச்சார உணவு மரபுகளைப் பாதுகாத்து அனைத்து மக்களையும் ஒன்றிணைக்கிறது.`;
      case 'te':
        return `ఈ పండుగ సామాజిక సామరస్యం, జానపద కళలు, హస్తకళలు మరియు సాంప్రదాయ వంటకాల వారసత్వాన్ని కాపాడుతూ అందరినీ ఏకం చేస్తుంది.`;
      case 'gu':
        return `આ મહોત્સવ સામાજિક સૌહાર્દ, લોકકલા, હસ્તકળા અને પરંપરાગત ખાનપાનના વારસાને જાળવી રાખીને તમામ સમુદાયોને એક તાંતણે બાંધે છે.`;
    }
  }

  return direct || fieldValue;
}
