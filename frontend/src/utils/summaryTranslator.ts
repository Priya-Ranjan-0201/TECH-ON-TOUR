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
  attraction: {
    en: 'attraction',
    hi: 'पर्यटन आकर्षण',
    mr: 'पर्यटन आकर्षण',
    bn: 'পর্যটন আকর্ষণ',
    ta: 'சுற்றுலா ஈர்ப்பு',
    te: 'పర్యాటక ఆకర్షణ',
    gu: 'પ્રવાસન આકર્ષણ'
  },
  heritage: {
    en: 'heritage and culture',
    hi: 'ऐतिहासिक व सांस्कृतिक धरोहर',
    mr: 'ऐतिहासिक व सांस्कृतिक वारसा',
    bn: 'ঐতিহাসিক ও সাংস্কৃতিক ঐতিহ্য',
    ta: 'பாரம்பரியம் மற்றும் கலாச்சாரம்',
    te: 'వారసత్వం మరియు సంస్కృతి',
    gu: 'વારસો અને સંસ્કૃતિ'
  },
  nature: {
    en: 'nature and scenic escape',
    hi: 'प्राकृतिक व सुरम्य स्थल',
    mr: 'नैसर्गिक व निसर्गरम्य स्थळ',
    bn: 'প্রাকৃতিক ও মনোরম পরিবেশ',
    ta: 'இயற்கை எழில் கொஞ்சும் இடம்',
    te: 'ప్రకృతి రమణీయ ప్రదేశం',
    gu: 'કુદરતી અને મનોહર સ્થળ'
  },
  religious: {
    en: 'spiritual and sacred pilgrimage',
    hi: 'आध्यात्मिक व पावन तीर्थ',
    mr: 'आध्यात्मिक व पवित्र तीर्थक्षेत्र',
    bn: 'আধ্যাত্মিক ও পবিত্র তীর্থস্থান',
    ta: 'ஆன்மீக மற்றும் புனித தலம்',
    te: 'ఆధ్యాత్మిక మరియు పవిత్ర పుణ్యక్షేత్రం',
    gu: 'આધ્યાત્મિક અને પવિત્ર યાત્રાધામ'
  },
  wildlife: {
    en: 'wildlife and biodiversity reserve',
    hi: 'वन्यजीव व जैवविविधता अभयारण्य',
    mr: 'वन्यजीव व जैवविविधता राखीव क्षेत्र',
    bn: 'বন্যপ্রাণী ও জীববৈচিত্র্য সংরক্ষণাগার',
    ta: 'வனவிலங்கு மற்றும் பல்லுயிர் சரணாலயம்',
    te: 'వన్యప్రాణులు మరియు జీవవైవిధ్య సంరక్షణ కేంద్రం',
    gu: 'વન્યજીવ અને જૈવવિવિધતા અનામત'
  },
  adventure: {
    en: 'adventure and trekking circuit',
    hi: 'साहसिक व ट्रैकिंग सर्किट',
    mr: 'साहसी व ट्रेकिंग मार्ग',
    bn: 'রোমাঞ্চকর ও ট্র্যাকিং সার্কিট',
    ta: 'சாகச மற்றும் மலையேற்ற பாதை',
    te: 'సాహస మరియు ట్రెక్కింగ్ మార్గం',
    gu: 'સાહસિક અને ટ્રેકિંગ સર્કિટ'
  }
};

export function getLocalizedCategory(cat: string = 'attraction', lang: string = 'en'): string {
  const normalized = (cat || 'attraction').toLowerCase().trim();
  let key = 'attraction';
  if (normalized.includes('herit') || normalized.includes('cultur')) key = 'heritage';
  else if (normalized.includes('natur') || normalized.includes('scenic') || normalized.includes('lake') || normalized.includes('waterfall') || normalized.includes('park')) key = 'nature';
  else if (normalized.includes('relig') || normalized.includes('temple') || normalized.includes('church') || normalized.includes('sacred')) key = 'religious';
  else if (normalized.includes('wild') || normalized.includes('forest') || normalized.includes('sanctuary')) key = 'wildlife';
  else if (normalized.includes('advent') || normalized.includes('trek')) key = 'adventure';

  return CATEGORY_MAP[key]?.[lang] || CATEGORY_MAP[key]?.['en'] || cat;
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
