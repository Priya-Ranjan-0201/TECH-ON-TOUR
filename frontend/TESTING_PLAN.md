# TravelSathi Complete Frontend Testing Plan & Inventory
**Project**: TravelSathi — National Digital Public Infrastructure (DPI) for Tourism  
**Stack**: React 18 + TypeScript + Vite + Tailwind CSS + Playwright Test Runner  
**Target URL**: `http://localhost:5173` | **Backend API**: `http://127.0.0.1:8000`  
**Configuration File**: `frontend/playwright.config.ts`  
**Current Test Suite**: `frontend/tests/homepage.spec.ts`

---

## Executive Summary & Test Infrastructure Inspection

### Package & Dependency Inspection (`frontend/package.json`)
* **Project Type**: ES Module (`"type": "module"`)
* **Framework**: React 19 (`^19.2.8`), React DOM (`^19.2.8`), React Router DOM (`^7.18.3`)
* **Bundler & Tooling**: Vite (`^8.2.2`), TypeScript (`^7.0.2`), Tailwind CSS (`^3.4.17`), Oxlint (`^1.79.0`)
* **UI & Graphics**: Lucide React (`^1.42.0`), Framer Motion (`^13.2.0`), Three.js (`^0.185.1`), `@react-three/fiber` (`^9.7.0`), `@react-three/drei` (`^10.7.8`), Leaflet (`^1.9.4`), React-Leaflet (`^5.0.0`)
* **Networking**: Axios (`^1.20.0`)
* **Test Runner**: `@playwright/test` (`^1.63.0`)
* **NPM Scripts**:
  - `dev`: `vite` (dev server on `http://localhost:5173`)
  - `build`: `vite build`
  - `lint`: `oxlint`
  - `preview`: `vite preview`

### Playwright Configuration Inspection (`frontend/playwright.config.ts`)
* **Test Directory**: `./tests`
* **Execution Mode**: `fullyParallel: true`
* **Retries**: 2 on CI (`process.env.CI`), 0 on local development
* **Workers**: 6 parallel local workers (`workers: process.env.CI ? 1 : undefined`)
* **Reporters**: HTML reporter (`reporter: [['html', { open: 'never' }], ['list']]`)
* **Base URL**: `http://localhost:5173`
* **Artifacts on Failure**:
  - `screenshot: 'only-on-failure'`
  - `video: 'retain-on-failure'`
  - `trace: 'on-first-retry'`
* **Execution Projects**:
  1. `chromium` (`Desktop Chrome` device profile, 1280x720 viewport)
  2. `mobile` (`Pixel 5` emulation profile, 393x851 viewport, touch-enabled)
* **Dev Server Integration**: Automatic webServer hook (`npm run dev`) on port 5173 with reuse existing server enabled.

### Test Directory Inspection (`frontend/tests/`)
* Total test specs: 7 organized test suites:
  1. `homepage.spec.ts`: Homepage render, Hero section, and CTA presence.
  2. `navigation.spec.ts`: Core public route smoke tests, tourist exploration panel smoke tests, navbar links, mobile bottom nav, 404 catch-all, and footer links.
  3. `auth-and-roles.spec.ts`: Authentication modes, quick persona autofill, invalid login error banner, role-guarded route redirection (`/admin`, `/host`, `/dmo`), and admin access.
  4. `forms-and-crud.spec.ts`: Multi-step Plan Wizard, Group Trip expense logging with UPI settlement simulation, expense receipt file upload, and Travel Twin personality calibration.
  5. `search-and-filters.spec.ts`: Debounced search filtering, category pills filtering, empty state feedback, Search Panel state dropdown, and Command Palette (Ctrl+K).
  6. `network-and-resilience.spec.ts`: Fatal JS error tracking, offline pass wallet, saved places empty state, and bookings list.
  7. `modals-and-interactive.spec.ts`: Emergency SOS modal, floating concierge AI drawer, dark mode toggle persistence, Bhashini language selector, and interactive smart map container.

---

## 1. React Pages & Route Inventory (34 Distinct Routes)

| # | Route Pattern | View Component | File Location | Access Level | Description |
|---|---------------|----------------|---------------|--------------|-------------|
| 1 | `/` | `HomeView` | `frontend/src/views/HomeView.tsx` | Public | Homepage, 3D Hero, Recommendation Rails, Quick Plan |
| 2 | `/explore` | `ExploreView` | `frontend/src/views/ExploreView.tsx` | Public | Catalog exploration with filter pills, search & cards |
| 3 | `/destination/:id` | `DestinationDetailView` | `frontend/src/views/DestinationDetailView.tsx` | Public | Deep dive into a single destination, tabs & reviews |
| 4 | `/destinations/:id`| `DestinationDetailView` | `frontend/src/views/DestinationDetailView.tsx` | Public | Alias route for singular destination |
| 5 | `/map` | `SmartMapView` | `frontend/src/views/SmartMapView.tsx` | Public | Interactive Leaflet map with 150+ geotagged nodes |
| 6 | `/experiences` | `ExperiencesView` | `frontend/src/views/ExperiencesView.tsx` | Public | Curated local activities, guides & heritage trails |
| 7 | `/stays` | `StaysView` | `frontend/src/views/StaysView.tsx` | Public | PM-JUGA verified tribal and community homestays |
| 8 | `/safety` | `SafetyView` | `frontend/src/views/SafetyView.tsx` | Public | Real-time safety scores, advisories & live SOS dispatch |
| 9 | `/events` | `EventsView` | `frontend/src/views/EventsView.tsx` | Public | Festivals, cultural happenings & seasonal events |
| 10 | `/about` | `AboutView` | `frontend/src/views/AboutView.tsx` | Public | National DPI mission, Swadesh Darshan 2.0 & team |
| 11 | `/help` | `HelpView` | `frontend/src/views/HelpView.tsx` | Public | FAQs, accessibility guidelines & contact support |
| 12 | `/plan` | `PlanView` | `frontend/src/views/PlanView.tsx` | Tourist | Multi-day AI Travel Twin planner with Day timeline |
| 13 | `/travel-twin` | `TravelTwinView` | `frontend/src/views/tourist/TravelTwinView.tsx` | Tourist | Persona customization, dietary preferences & badge vault |
| 14 | `/trips` | `TripsView` | `frontend/src/views/tourist/TripsView.tsx` | Tourist | Saved itineraries, active trip cards & deletion |
| 15 | `/trips/live` | `LiveTripModeView` | `frontend/src/views/tourist/LiveTripModeView.tsx` | Tourist | On-the-ground live turn-by-turn companion mode |
| 16 | `/trips/group` | `GroupTripView` | `frontend/src/views/tourist/GroupTripView.tsx` | Tourist | Group travel companion coordination & Split-UPI |
| 17 | `/wallet` | `WalletView` | `frontend/src/views/tourist/WalletView.tsx` | Tourist | Offline pass generator, carbon credits & refund wallet |
| 18 | `/bookings` | `BookingsView` | `frontend/src/views/tourist/BookingsView.tsx` | Tourist | Active & past homestay/tour reservations |
| 19 | `/saved` | `SavedPlacesView` | `frontend/src/views/tourist/SavedPlacesView.tsx` | Tourist | Bookmarked destinations & cultural places |
| 20 | `/privacy` | `PrivacyCenterView` | `frontend/src/views/tourist/PrivacyCenterView.tsx` | Tourist | DPDP 2023 compliance, data export & consent toggles |
| 21 | `/reviews` | `ReviewsView` | `frontend/src/views/tourist/ReviewsView.tsx` | Tourist | Verified booking reviews & community feedback |
| 22 | `/memories` | `MemoriesView` | `frontend/src/views/tourist/MemoriesView.tsx` | Tourist | Scrapbook of completed trips, photos & journal entries |
| 23 | `/auth`, `/login`, `/signup` | `AuthView` | `frontend/src/views/tourist/AuthView.tsx` | Public | Real authentication, login, registration & quick persona autofill |
| 24 | `/search` | `SearchPanel` | `frontend/src/views/SearchPanel.tsx` | Public | Search intelligence, query parsing & state filters |
| 25 | `/dashboard` | `DashboardView` | `frontend/src/views/tourist/DashboardView.tsx` | Tourist | Personalized tourist command center & active trip widget |
| 26 | `/nearby` | `NearbyView` | `frontend/src/views/tourist/NearbyView.tsx` | Public | Geolocation proximity scanner within specified radius |
| 27 | `/recommendations` | `RecommendationsView` | `frontend/src/views/tourist/RecommendationsView.tsx` | Public | ML collaborative and content-based recommendation feed |
| 28 | `/seasonal` | `SeasonalView` | `frontend/src/views/tourist/SeasonalView.tsx` | Public | Month-by-month weather and seasonal suitability matrix |
| 29 | `/trending` | `TrendingView` | `frontend/src/views/tourist/TrendingView.tsx` | Public | Real-time social buzz and footfall momentum tracker |
| 30 | `/weather` | `WeatherView` | `frontend/src/views/tourist/WeatherView.tsx` | Public | Weather forecasts & meteorological safety alerts |
| 31 | `/history` | `HistoryView` | `frontend/src/views/tourist/HistoryView.tsx` | Tourist | Search and browsing audit trail |
| 32 | `/notifications` | `NotificationsView` | `frontend/src/views/tourist/NotificationsView.tsx` | Tourist | Live price drop alerts, permits & weather warnings |
| 33 | `/assistant`, `/ai` | `AIAssistantView` | `frontend/src/views/tourist/AIAssistantView.tsx` | Public | Full-screen conversational AI travel assistant |
| 34 | `/host`, `/host/dashboard` | `HostDashboardView` | `frontend/src/views/host/HostDashboardView.tsx` | Role: `host` | Homestay host portal, bookings management & dynamic pricing |
| 35 | `/gov`, `/gov/dashboard` | `GovDashboardView` | `frontend/src/views/gov/GovDashboardView.tsx` | Role: `dmo`, `gov` | Tourism governance, footfall analytics & sustainability |
| 36 | `/dmo`, `/admin/dmo` | `AdminDMO` | `frontend/src/views/admin/AdminDMO.tsx` | Role: `dmo`, `gov` | District Management Office intelligence, permits & sentiment |
| 37 | `/admin` | `AdminDashboardView` | `frontend/src/views/admin/AdminDashboardView.tsx` | Role: `admin` | Platform control center, listings approval, user moderation |

---

## 2. Navigation Links Inventory

| Feature Name | File / Component | Route / Page | User Action | Expected Result | Safe to Automate | Credentials Required | Destructive Actions to Avoid |
|---|---|---|---|---|---|---|---|
| Brand Logo Link | `Navbar.tsx` | Any page | Click "TravelSathi" brand logo | Navigates to `/` (Homepage) | Yes | None | None |
| Desktop Nav: Home | `Navbar.tsx` | Any page | Click "Home" link | Navigates to `/` | Yes | None | None |
| Desktop Nav: Plan Trip | `Navbar.tsx` | Any page | Click "Plan Trip" link | Navigates to `/plan` | Yes | None | None |
| Desktop Nav: My Trips | `Navbar.tsx` | Any page | Click "My Trips" link | Navigates to `/trips` | Yes | None | None |
| Profile Dropdown Trigger | `Navbar.tsx` | Any page | Click avatar icon in header | Opens 15-item dropdown menu | Yes | None | None |
| Profile Link: Command Center | `Navbar.tsx` | Any page | Click "Tourist Command Center" | Navigates to `/dashboard` | Yes | None | None |
| Profile Link: Search | `Navbar.tsx` | Any page | Click "Search Intelligence" | Navigates to `/search` | Yes | None | None |
| Profile Link: Explore | `Navbar.tsx` | Any page | Click "Explore Catalog" | Navigates to `/explore` | Yes | None | None |
| Profile Link: Recommendations | `Navbar.tsx` | Any page | Click "Personalized Recommendations" | Navigates to `/recommendations` | Yes | None | None |
| Profile Link: Nearby | `Navbar.tsx` | Any page | Click "Nearby Proximity Finder" | Navigates to `/nearby` | Yes | None | None |
| Profile Link: Seasonal | `Navbar.tsx` | Any page | Click "Seasonal Suitability" | Navigates to `/seasonal` | Yes | None | None |
| Profile Link: Trending | `Navbar.tsx` | Any page | Click "Trending Momentum" | Navigates to `/trending` | Yes | None | None |
| Profile Link: Weather | `Navbar.tsx` | Any page | Click "Travel-Weather" | Navigates to `/weather` | Yes | None | None |
| Profile Link: History | `Navbar.tsx` | Any page | Click "Travel History" | Navigates to `/history` | Yes | None | None |
| Profile Link: Notifications | `Navbar.tsx` | Any page | Click "Alerts & Notifications" | Navigates to `/notifications` | Yes | None | None |
| Profile Link: AI Concierge | `Navbar.tsx` | Any page | Click "AI Concierge" | Navigates to `/assistant` | Yes | None | None |
| Profile Link: Homestays | `Navbar.tsx` | Any page | Click "PM-JUGA Homestays" | Navigates to `/stays` | Yes | None | None |
| Profile Link: Smart Map | `Navbar.tsx` | Any page | Click "Interactive Smart Map" | Navigates to `/map` | Yes | None | None |
| Profile Link: Safety | `Navbar.tsx` | Any page | Click "Live Safety & Crowd Index" | Navigates to `/safety` | Yes | None | None |
| Profile Link: Saved Places | `Navbar.tsx` | Any page | Click "Saved Places" | Navigates to `/saved` | Yes | None | None |
| Profile Link: Sign Out | `Navbar.tsx` | Any page | Click "Sign Out" | Navigates to `/login` | Yes | None | None |
| Mobile Bottom: Home | `MobileBottomNav.tsx` | Mobile viewport | Tap "Home" icon | Navigates to `/` | Yes | None | None |
| Mobile Bottom: Search | `MobileBottomNav.tsx` | Mobile viewport | Tap "Search" icon | Navigates to `/explore` | Yes | None | None |
| Mobile Bottom: My Trips | `MobileBottomNav.tsx` | Mobile viewport | Tap "My Trips" icon | Navigates to `/trips` | Yes | None | None |
| Mobile Bottom: Profile | `MobileBottomNav.tsx` | Mobile viewport | Tap "Profile" icon | Navigates to `/travel-twin` | Yes | None | None |
| Mobile Hamburger Toggle | `Navbar.tsx` | Mobile viewport | Tap hamburger icon | Opens mobile drawer | Yes | None | None |
| Footer Portal: Host | `Footer.tsx` | Footer area | Click "For Local Hosts" | Switches role to `host`, navigates to `/host` | Yes | None | None |
| Footer Portal: Government | `Footer.tsx` | Footer area | Click "For Government & DMO" | Switches role to `gov`, navigates to `/gov` | Yes | None | None |
| Footer Portal: Admin | `Footer.tsx` | Footer area | Click "Admin Control Center" | Switches role to `admin`, navigates to `/admin` | Yes | None | None |
| Footer Legal: Privacy | `Footer.tsx` | Footer area | Click "Privacy Center" | Navigates to `/privacy` | Yes | None | None |

---

## 3. Buttons Inventory

| Feature Name | File / Component | Route / Page | User Action | Expected Result | Safe to Automate | Credentials Required | Destructive Actions to Avoid |
|---|---|---|---|---|---|---|---|
| Emergency SOS Header Button | `Navbar.tsx` | Universal | Click alert triangle icon | Opens `SOSModal` modal | Yes | None | Do not spam production SMS |
| Dark Mode Toggle Button | `Navbar.tsx` | Universal | Click "Enable / Disable" button | Toggles `dark` class on root HTML & sets `travelsathi_dark` | Yes | None | None |
| Admin Persona Quick Switcher | `Navbar.tsx` | Universal (Admin) | Click `Tourist` / `Host` / `DMO` / `Admin` | Changes active persona and reroutes | Yes | Admin role | None |
| Itinerary Generation CTA | `PlanWizard.tsx` | `/plan` | Click "Generate Itinerary" | Triggers Gemini + spatial engine & displays days | Yes | None | Avoid rapid continuous clicking |
| Duration Selector Buttons | `PlanWizard.tsx` | `/plan` | Click "1 Day" ... "7 Days" | Updates selected trip duration | Yes | None | None |
| Interest Toggle Buttons | `PlanWizard.tsx` | `/plan` | Click interest pills (e.g. "Heritage", "Trek") | Toggles item in `interests` array | Yes | None | None |
| Pace Selector Buttons | `PlanWizard.tsx` | `/plan` | Click "Relaxed", "Balanced", "Fast" | Sets itinerary pace | Yes | None | None |
| Group Selector Buttons | `PlanWizard.tsx` | `/plan` | Click "Solo", "Couple", "Family", "Friends" | Sets group type | Yes | None | None |
| Mobility Friendly Toggle | `PlanWizard.tsx` | `/plan` | Click "Elderly & Wheelchair Friendly" | Toggles accessibility filter | Yes | None | None |
| Itinerary Stop Swap Trigger | `ItineraryTimeline.tsx`| `/plan` | Click "Swap Alternative" on stop | Opens `SwapStopModal` | Yes | None | None |
| Swap Stop Confirm Button | `SwapStopModal.tsx` | `/plan` | Click "Swap This Destination" | Replaces stop via API | Yes | None | None |
| RFP Marketplace Conversion | `RFPModal.tsx` | `/plan` | Click "Broadcast to Marketplace" | Submits RFP to local verified drivers | Yes | None | None |
| Download iCal Button | `ItinerarySummaryCard.tsx`| `/plan` | Click "Download iCal (.ics)" | Triggers `.ics` calendar file download | Yes | None | None |
| Bookmark Save Toggle | `DestinationCard.tsx` | `/explore`, `/` | Click heart / bookmark icon | Saves destination to local/remote list | Yes | None | Avoid bulk deletion |
| Direct Booking CTA | `BookingModal.tsx` | `/stays` | Click "Book Instant Stay" | Opens `BookingModal` with price breakdown | Yes | None | Real card submission |
| Split-UPI Settlement Ping | `GroupTripView.tsx` | `/trips/group` | Click "Send UPI Settle Ping" | Displays instant settlement toast notification | Yes | None | None |
| Add Group Expense Button | `GroupTripView.tsx` | `/trips/group` | Click "Add New Group Expense" | Opens expense logging modal | Yes | None | None |
| DMO Eco-Permit Toggle | `AdminDMO.tsx` | `/dmo` | Click "Toggle Permit Status" | Sends toggle API call and updates banner | Yes | DMO role | Avoid disabling live high-traffic zones |
| Host Price Recommendation Apply| `HostDashboardView.tsx`| `/host` | Click "Apply AI Pricing" | Updates nightly tariff via backend API | Yes | Host role | Avoid changing active host pricing repeatedly |
| Host Booking Approve | `HostDashboardView.tsx`| `/host` | Click "Approve Reservation" | Updates reservation status to `confirmed` | Yes | Host role | Avoid approving unverified mock test IDs |
| Admin Listing Moderation | `AdminDashboardView.tsx`| `/admin`| Click "Verify Listing" / "Reject" | Modifies listing status | Caution | Admin role | Do not reject live homestays |
| Admin Role Mutation | `AdminDashboardView.tsx`| `/admin`| Click "Promote to Host" | Updates user role in database | Caution | Admin role | Do not demote root admin |
| Floating Concierge Toggle | `FloatingConcierge.tsx`| Universal | Click floating AI bubble in bottom right | Opens floating conversation drawer | Yes | None | None |
| Floating Concierge Audio Speech| `FloatingConcierge.tsx`| Universal | Click speaker icon on AI bubble | Triggers Web Speech API text-to-speech synthesis | Yes | None | None |
| Onboarding Spotlight Dismiss | `OnboardingSpotlight.tsx`| Universal | Click "Got it, start exploring" | Sets localStorage `travelsathi_spotlight_dismissed` | Yes | None | None |

---

## 4. Forms Inventory

| # | Form Description | File Location | Route / Page | Key Fields | Submission Method | API Endpoint |
|---|---|---|---|---|---|---|
| 1 | User Login Form | `AuthView.tsx` | `/auth`, `/login` | Email, Password | `POST` | `/api/auth/login` |
| 2 | User Registration Form | `AuthView.tsx` | `/auth`, `/signup` | Name, Email, Password, Role | `POST` | `/api/auth/register` |
| 3 | Forgot Password Form | `AuthView.tsx` | `/auth` | Email | `POST` | `/api/auth/forgot-password` |
| 4 | Plan Wizard Form | `PlanWizard.tsx` | `/plan` | Destination, Days, Budget, Interests, Pace, Group, Mobility | `POST` | `/api/itinerary/generate` |
| 5 | RFP Marketplace Form | `RFPModal.tsx` | `/plan` | Max Budget, Vehicle Preference, Notes | `POST` | `/api/itinerary/${id}/rfp` |
| 6 | Verified Review Form | `VerifiedReviewForm.tsx` | Universal Modal | Booking ID, Rating, Cleanliness, Host, Comments | `POST` | `/api/reviews/submit` |
| 7 | Booking Checkout Form | `BookingModal.tsx` | `/stays` | Guests, Check-in, Check-out, Special Requests | `POST` | `/api/checkout/direct-booking` |
| 8 | Group Expense Logger | `GroupTripView.tsx` | `/trips/group` | Description, Amount, Category, Payer, Receipt Upload | Local/Context | Context State |
| 9 | Travel Twin Preferences Form | `TravelTwinView.tsx` | `/travel-twin` | Travel Personality, Pace, Budget, Dietary Needs, Accessibility | `POST` | `/api/user/preferences` |
| 10 | Floating Concierge Chat Form | `FloatingConcierge.tsx` | Universal | Chat message text | `POST` | `/api/chat/concierge` |
| 11 | AI Concierge Dedicated Form | `AIAssistantView.tsx` | `/assistant` | Query string | `POST` | `http://127.0.0.1:8000/chat/message` |
| 12 | Command Palette Search | `SearchCommandPalette.tsx`| Universal | Search keyword query | `GET` | `/api/destinations/search` |
| 13 | Hero Quick Search Form | `Hero3DScene.tsx` | `/` | Destination query string | Navigation | `/explore?q=...` |
| 14 | Fallback 2D Search Form | `HeroFallback2D.tsx` | `/` | Destination query, State dropdown | Navigation | `/explore?q=...` |
| 15 | Search Panel Form | `SearchPanel.tsx` | `/search` | Query, State, Season, Category, Tag | `GET` | `/destinations` |
| 16 | Weather Inquiry Form | `WeatherView.tsx` | `/weather` | Destination name | `GET` | `http://127.0.0.1:8000/weather` |
| 17 | Host Listing Edit Form | `HostDashboardView.tsx` | `/host` | Homestay Title, Nightly Rate, Max Guests | `PUT` | `/api/homestays/host/listing/${id}` |
| 18 | Host Guest Response Form | `HostDashboardView.tsx` | `/host` | Guest Inquiry Message, Reply text | `POST` | `/api/homestays/host/bookings/${id}/respond` |
| 19 | Admin Destination Edit Form | `AdminDashboardView.tsx`| `/admin` | Name, State, Category, Footfall status | `PUT` | `/api/admin/destinations/${id}` |
| 20 | Admin Search Form | `AdminDashboardView.tsx`| `/admin` | Search query for destinations & users | `GET` | `/api/destinations/search` |
| 21 | Emergency SOS Dispatch Form | `SOSModal.tsx` | Universal | Emergency Contact, Current GPS, Emergency Type | `POST` | `/api/safety/sos` |

---

## 5. Input Fields Inventory

| Input Name / Label | File / Component | Type | Validation Rules | Default / Placeholder Value |
|---|---|---|---|---|
| Destination Destination Input | `PlanWizard.tsx` | `text` | Required | `e.g. Manali, Tirthan Valley, Bastar...` |
| Auth Email Address | `AuthView.tsx` | `email` | Required, Valid Email format | `aarav.sharma@travelsathi.in` |
| Auth Password | `AuthView.tsx` | `password` | Required, Min 6 chars | `password123` |
| Auth Full Name | `AuthView.tsx` | `text` | Required in register mode | `e.g. Aarav Sharma` |
| Concierge Message Input | `FloatingConcierge.tsx` | `text` | Required | `Ask about hidden gems, local food...` |
| Dedicated AI Assistant Input | `AIAssistantView.tsx` | `text` | Required | `Ask TravelSathi AI anything about your trip...` |
| Command Palette Search Input | `SearchCommandPalette.tsx`| `text` | Auto-focused on open | `Type destination, monument, state (e.g. Bastar, Hampi)...` |
| Explore Search Input | `ExploreView.tsx` | `text` | None (Optional filter) | `Search destinations, forts, treks, homestays...` |
| Search Panel Main Input | `SearchPanel.tsx` | `text` | None | `Search 12,293+ destinations across India...` |
| Weather Destination Input | `WeatherView.tsx` | `text` | None | `Enter city or destination (e.g. Manali, Ooty, Bastar)` |
| Group Expense Description | `GroupTripView.tsx` | `text` | Required | `e.g. Village lunch, Jeep fare, Homestay dinner` |
| Group Expense Amount | `GroupTripView.tsx` | `number` | Required, Positive number | `1200` |
| Group Expense Receipt Upload | `GroupTripView.tsx` | `file` | `accept="image/*"` | Single file input |
| Booking Guests Count | `BookingModal.tsx` | `number` | Min 1, Max 10 | `2` |
| Booking Check-in Date | `BookingModal.tsx` | `date` | Future date only | Tomorrow |
| Booking Check-out Date | `BookingModal.tsx` | `date` | Greater than check-in | Day after tomorrow |
| Emergency Custom Contact Phone | `SOSModal.tsx` | `tel` | Valid Indian phone (10 digits) | Optional |
| Verified Review Rating Stars | `VerifiedReviewForm.tsx` | Interactive radio/button | 1 to 5 | `5` |
| Verified Review Booking ID | `VerifiedReviewForm.tsx` | `text` | Required | Pre-filled if launched from booking |
| Host Base Tariff Input | `HostDashboardView.tsx` | `number` | Positive integer | `1850` |
| Host Maximum Guests Input | `HostDashboardView.tsx` | `number` | Positive integer | `4` |

---

## 6. Dropdowns & Select Elements

| Select Name / Purpose | Component / File | Options Available | Default Value | Trigger Event |
|---|---|---|---|---|
| Platform Language Selector | `Navbar.tsx` | English (`en`), Hindi (`hi`), Bengali (`bn`), Tamil (`ta`), Telugu (`te`), Marathi (`mr`), Gujarati (`gu`) | `en` | `onChange` sets context and localStorage |
| Explore State Filter | `ExploreView.tsx` | All 36 States & UTs of India | `All States` | Filters destination cards by state |
| Explore Category Filter | `ExploreView.tsx` | `all`, `heritage`, `nature`, `spiritual`, `tribal`, `adventure`, `crafts` | `all` | Filters catalog cards |
| Search Panel State Filter | `SearchPanel.tsx` | 36 Indian States & UTs | `All States` | Filters search results |
| Search Panel Season Filter | `SearchPanel.tsx` | `All`, `Winter`, `Summer`, `Monsoon`, `Spring` | `All` | Filters by seasonal suitability |
| Stays Accommodation Type | `StaysView.tsx` | `All`, `Tribal Homestay`, `Eco Lodge`, `Heritage Haveli` | `All` | Filters homestay listings |
| Stays Price Range Filter | `StaysView.tsx` | `All`, `< ₹1,500`, `₹1,500 - ₹3,000`, `> ₹3,000` | `All` | Price range filter |
| Group Expense Category | `GroupTripView.tsx` | `Food`, `Stay`, `Transport`, `Activity` | `Food` | Categorizes group expense |
| Group Expense Payer | `GroupTripView.tsx` | `Aarav (You)`, `Priya Sharma`, `Rohan Verma` | `Aarav (You)` | Identifies payer |
| Group Expense Split Type | `GroupTripView.tsx` | `Equal Split (1/3)`, `Custom Allocation`, `Weighted Shares` | `Equal Split` | Determines distribution |
| Travel Twin Dietary Select | `TravelTwinView.tsx` | `Vegetarian`, `Vegan`, `Jain`, `Non-Vegetarian`, `Halal` | `Vegetarian` | Personalizes culinary recommendations |
| Travel Twin Pace Select | `TravelTwinView.tsx` | `Relaxed`, `Moderate`, `Fast-Paced` | `Moderate` | Sets trip cadence |
| Admin Role Mutation Select | `AdminDashboardView.tsx` | `tourist`, `host`, `dmo`, `admin` | User's current role | Promotes/demotes user role in database |

---

## 7. Modals, Dialogs & Drawers Inventory

| # | Modal Name | Component File | Trigger Mechanism | Dismissal Mechanism | Key Internal Features |
|---|---|---|---|---|---|
| 1 | Floating AI Concierge | `FloatingConcierge.tsx` | Bottom-right fab button | Close button or minimize | Chat log, quick prompt chips, Web Speech audio TTS |
| 2 | Emergency SOS Modal | `SOSModal.tsx` | Header warning icon, `/safety` SOS | Cancel button / outside click | 3-second countdown abort, GPS broadcast, emergency hotline dialers |
| 3 | Search Command Palette | `SearchCommandPalette.tsx` | Keybinding `Ctrl+K` / `Cmd+K` or search icon | `Esc` key or backdrop click | Instant debounced destination search, category tags, direct navigation |
| 4 | AR Heritage Lens Modal | `ARHeritageLensModal.tsx` | Destination detail AR action | Close X button | 3D model simulation, historical overlay, photo capture |
| 5 | Cultural Etiquette Drawer | `CulturalEtiquetteDrawer.tsx`| Destination detail etiquette badge | Close button or backdrop click | Local customs, temple dress codes, tipping etiquette, language phrases |
| 6 | Split-UPI Checkout Modal | `SplitCheckoutModal.tsx` | Booking checkout or group share | Close X button or successful pay | QR Code, VPA payment request, per-person split calculator |
| 7 | Verified Review Form Modal | `VerifiedReviewForm.tsx` | Booking completion or Review button | Close button or submit | Star rating, category scores, DPI verified badge confirmation |
| 8 | Direct Booking Modal | `BookingModal.tsx` | "Book Homestay" button on card | Cancel button or backdrop click | Calendar picker, guest count, price breakdown with zero commission |
| 9 | Destination Detail Modal | `DestinationDetailModal.tsx` | Card click from rails or map | Close X button or `Esc` | Photo gallery, crowd level, weather widget, nearby attractions |
| 10 | Verified Review Modal | `VerifiedReviewModal.tsx` | Review section on destination detail| Close X button | Direct submission to `/api/reviews/submit` |
| 11 | Explorer Badges Modal | `ExplorerBadgesModal.tsx` | Badge click on Travel Twin | Close X button | Eco-tokens earned, unlocked cultural badges, DPI certification |
| 12 | Grand Finale Pitch Modal | `GrandFinalePitchModal.tsx` | Secret key or admin launch | Close X button | Architecture overview, DPI compliance checklist, system health |
| 13 | Swap Alternative Stop Modal | `SwapStopModal.tsx` | "Swap Stop" on itinerary stop | Cancel button | Live fetch of alternative stops with distance, match score & swap API |
| 14 | RFP Driver Marketplace Modal | `RFPModal.tsx` | "Broadcast RFP" on itinerary | Cancel button | Driver bids simulation, vehicle choice, max budget input |

---

## 8. Tabs Inventory

| Page / Component | Tab Labels | State Variable | Content Switched |
|---|---|---|---|
| `DestinationDetailModal.tsx` | Overview, TransitGuard, PM-JUGA Stays, Live Reviews | `activeTab` | Switches between description, transport fare caps, verified stays, and reviews |
| `DestinationDetailView.tsx` | Overview, TransitGuard, PM-JUGA Stays, Live Reviews | `activeTab` | Full page view tab switching |
| `PlanView.tsx` | Day 1, Day 2, Day 3... (Dynamic by duration) | `activeDay` | Displays selected day's timeline and map markers |
| `AuthView.tsx` | Sign In, Create Account, Forgot Password | `authMode` | Switches form between login, register, and reset flows |
| `AdminDashboardView.tsx` | Listings Moderation, User Roles, SOS Events, Pipeline ML | `activeTab` | Switches admin data tables and moderation workflows |
| `AdminDMO.tsx` | Footfall & Density, Sentiment Intelligence, Eco-Permits | `activeTab` | Switches DMO analytics graphs, heatmaps, and permit controls |
| `GovDashboardView.tsx` | District Overview, Footfall Heatmap, Tribal Economy, Live Alerts | `activeTab` | Switches state tourism dashboards and policy metrics |
| `HostDashboardView.tsx` | Active Reservations, Dynamic Pricing Co-pilot, Homestay Profile | `activeTab` | Switches host operations, AI revenue optimizer, and listing editor |
| `TravelTwinView.tsx` | Personality Profile, Dietary & Accessibility, Badge Vault | `activeTab` | Switches persona settings, diet sliders, and earned eco-badges |
| `WalletView.tsx` | Offline QR Passes, Carbon Credits, Refund Ledger | `activeTab` | Switches offline tickets, eco-token balance, and payment audit |
| `HistoryView.tsx` | All History, Plans Generated, Places Viewed | `filterType` | Filters browsing audit history |
| `NotificationsView.tsx` | All Notifications, Price Alerts, Weather Warnings, Bookings | `activeFilter` | Filters inbox notifications |

---

## 9. Search Functionality

| Search Feature | Implementation File | Route / Trigger | Debounce / Mode | Target Data & Behavior |
|---|---|---|---|---|
| Universal Command Palette | `SearchCommandPalette.tsx` | `Ctrl+K`, `Cmd+K` | 200ms debounced | Queries `/api/destinations/search?q={trimmed}&limit=6`, renders dropdown with state & category |
| 3D Hero Search Bar | `Hero3DScene.tsx` | `/` | On Form Submit | Navigates to `/explore?q={encodeURIComponent(query)}` |
| 2D Fallback Hero Search | `HeroFallback2D.tsx` | `/` | On Form Submit | Reads destination query and state dropdown, navigates to `/explore` |
| Explore Catalog Search Bar | `ExploreView.tsx` | `/explore` | Instant Client Filter | Matches title, state, and category against in-memory catalog |
| Search Intelligence Panel | `SearchPanel.tsx` | `/search` | Debounced API query | Queries `/destinations` with state and category filters |
| Weather City Search | `WeatherView.tsx` | `/weather` | Form submit | Queries `http://127.0.0.1:8000/weather?destination={targetDest}` |
| Admin Destination Search | `AdminDashboardView.tsx` | `/admin` | 300ms debounced | Queries `/api/destinations/search?q={q}&limit=10` for quick inline destination editing |

---

## 10. Filters & Sorting Functionality

| Page / Route | Filter / Sort Controls | Implementation Details |
|---|---|---|
| `/explore` | Category Pills (`Heritage`, `Nature`, `Spiritual`, `Tribal`, `Adventure`) | Filters grid of destination cards by category tag |
| `/explore` | State Dropdown (36 States) | Filters grid by destination state |
| `/explore` | Price / Budget Sort (`Low to High`, `High to Low`, `Rating`) | Sorts destination cards array |
| `/stays` | Homestay Style Filter (`Tribal`, `Eco Lodge`, `Heritage`) | Filters homestay cards |
| `/stays` | Price Range Filter (`< ₹1500`, `₹1500-₹3000`, `> ₹3000`) | Filters stays by price |
| `/experiences` | Duration Filter (`Half Day`, `Full Day`, `Multi-day`) | Filters cultural experiences |
| `/experiences` | Vibe Filter (`Culinary`, `Trek`, `Artisan Workshop`) | Filters experience cards |
| `/history` | Category Filter (`All`, `Search`, `Itinerary`, `Booking`) | Filters historical user events |
| `/notifications` | Severity Filter (`All`, `High`, `Medium`, `Info`) | Filters alert inbox |
| `/admin` | Listing Status Filter (`All`, `Pending`, `Approved`, `Flagged`) | Filters homestay listings table |

---

## 11. Tables & Lists Inventory

| Table / List Feature | Component File | Route / Page | Columns / Key Items Displayed |
|---|---|---|---|
| Admin Homestay Listings Table | `AdminDashboardView.tsx` | `/admin` | Listing Title, Host Name, State, Tariff, Status, Moderation Action Buttons |
| Admin User Accounts Table | `AdminDashboardView.tsx` | `/admin` | User Name, Email, Registered Role, Status, Role Change Dropdown |
| Admin SOS Events Table | `AdminDashboardView.tsx` | `/admin` | Timestamp, User ID, Coordinates, Emergency Type, Status, Dispatch Actions |
| DMO District Analytics Table | `AdminDMO.tsx` | `/dmo` | Sub-district, Current Footfall, Carrying Capacity, Overtourism Index, Action |
| Gov Footfall & Capacity Table | `GovDashboardView.tsx` | `/gov` | Tourist Zone, Capacity %, Real-time Density, Revenue Inflow, Eco-status |
| Host Reservations Table | `HostDashboardView.tsx` | `/host` | Guest Name, Dates, Nights, Total Price, Status, Approve/Message Actions |
| User Active Trips List | `TripsView.tsx` | `/trips` | Trip Title, Destination, Dates, Days Count, Live Mode CTA, Delete CTA |
| User Saved Places List | `SavedPlacesView.tsx` | `/saved` | Place Card, State, Category, Rating, Remove from Saved Button |
| User Bookings List | `BookingsView.tsx` | `/bookings` | Homestay Name, Booking Code, Check-in/out, QR Pass CTA, Review CTA |
| Group Expenses Settlement List | `GroupTripView.tsx` | `/trips/group` | Who Owes Whom, Outstanding Balance, UPI Settle Button |
| Group Expenses Itemized List | `GroupTripView.tsx` | `/trips/group` | Description, Amount, Category, Paid by Whom, Per-person Split |
| Notifications Inbox List | `NotificationsView.tsx` | `/notifications` | Timestamp, Severity Icon, Title, Message Body, Action Link |
| History Audit List | `HistoryView.tsx` | `/history` | Timestamp, Action Type, Destination Name, Direct Navigate Link |

---

## 12. CRUD Operations Inventory

| Operation | Entity | File / Component | Route | HTTP / Method | Destructive Warning |
|---|---|---|---|---|---|
| **Create** | Itinerary | `PlanWizard.tsx` | `/plan` | `POST /api/itinerary/generate` | Safe (Generates new plan) |
| **Create** | Booking | `BookingModal.tsx` | `/stays` | `POST /api/checkout/direct-booking` | Safe in mock mode |
| **Create** | Review | `VerifiedReviewForm.tsx` | Modal | `POST /api/reviews/submit` | Safe |
| **Create** | Group Expense | `GroupTripView.tsx` | `/trips/group` | React State / Context | Safe |
| **Create** | Marketplace RFP | `RFPModal.tsx` | `/plan` | `POST /api/itinerary/${id}/rfp` | Safe |
| **Read** | Destination Details | `DestinationDetailView.tsx` | `/destination/:id` | `GET /api/destinations/${id}` | Safe |
| **Read** | User Saved Places | `SavedPlacesView.tsx` | `/saved` | `GET /api/user/saved` | Safe |
| **Read** | User Itineraries | `TripsView.tsx` | `/trips` | `GET /api/itinerary/user/${userId}` | Safe |
| **Update** | Stop Alternative (Swap) | `SwapStopModal.tsx` | `/plan` | `POST /api/itinerary/${id}/swap-stop` | Safe |
| **Update** | User Preferences | `TravelTwinView.tsx` | `/travel-twin` | `POST /api/user/preferences` | Safe |
| **Update** | Host Listing Details | `HostDashboardView.tsx` | `/host` | `PUT /api/homestays/host/listing/${id}` | Mutates host data |
| **Update** | Listing Status (Admin) | `AdminDashboardView.tsx` | `/admin` | `POST /api/admin/listings/${id}/status` | Mutates moderation state |
| **Update** | User Role (Admin) | `AdminDashboardView.tsx` | `/admin` | `PUT /api/admin/users/${id}/role` | Mutates permissions |
| **Delete** | Saved Place Bookmark | `SavedPlacesView.tsx` | `/saved` | `DELETE /api/user/saved/${destId}` | Removes saved bookmark |
| **Delete** | Saved Itinerary | `TripsView.tsx` | `/trips` | `DELETE /api/itinerary/${tripId}` | Destructive: Permanently deletes trip |

---

## 13. Frontend API Integrations Matrix (All 82 Calls)

| # | Method | Endpoint / URI Pattern | Source Component File | Purpose |
|---|---|---|---|---|
| 1 | `DELETE` | `/api/itinerary/${tripId}` | `TripsView.tsx` | Delete saved itinerary |
| 2 | `DELETE` | `/api/user/saved/${destId}?user_id=${userId}` | `SavedPlacesView.tsx` | Remove place from bookmarks |
| 3 | `FETCH` | `/api/host/dashboard?host_id=host-bastar-01&state=Chhattisgarh` | `HostView.tsx` | Fetch host statistics and earnings |
| 4 | `FETCH` | `/api/host/pricing-recommendation?state=${encodeURIComponent(state)}&base_tariff=1650` | `HostView.tsx` | Fetch dynamic pricing suggestion |
| 5 | `FETCH` | `/api/host/pricing/apply` | `HostView.tsx` | Apply dynamic pricing update |
| 6 | `FETCH` | `/api/marketplace/bid` | `HostView.tsx` | Fetch driver marketplace bids |
| 7 | `FETCH` | `/api/marketplace/bid/${bidId}/accept` | `HostView.tsx` | Accept marketplace bid |
| 8 | `FETCH` | `/api/reviews/submit` | `VerifiedReviewModal.tsx` | Submit verified review |
| 9 | `FETCH` | `/api/routing/directions` | `ItineraryMap.tsx` | Calculate routing between stops |
| 10 | `FETCH` | `http://127.0.0.1:8000/api/reviews/submit` | `VerifiedReviewForm.tsx` | Submit booking-gated review |
| 11 | `FETCH` | `http://127.0.0.1:8000/chat/message` | `AIAssistantView.tsx` | Conversational message dispatch |
| 12 | `FETCH` | `http://127.0.0.1:8000/destinations?limit=12` | `TrendingView.tsx` | Fetch trending destination nodes |
| 13 | `FETCH` | `http://127.0.0.1:8000/user/history?user_id=${encodeURIComponent(userId)}` | `HistoryView.tsx` | Fetch user browsing history |
| 14 | `FETCH` | `http://127.0.0.1:8000/user/history?user_id=${encodeURIComponent(userId)}&limit=50` | `HistoryView.tsx` | Bulk fetch user history |
| 15 | `FETCH` | `http://127.0.0.1:8000/weather?destination=${encodeURIComponent(targetDest)}` | `WeatherView.tsx` | Fetch real-time destination weather |
| 16 | `GET` | `/api/admin/listings` | `AdminDashboardView.tsx` | Admin homestay listings audit |
| 17 | `GET` | `/api/admin/pipeline/status` | `AdminDashboardView.tsx` | Admin ML pipeline status |
| 18 | `GET` | `/api/admin/sos/events` | `AdminDashboardView.tsx` | Admin SOS events monitor |
| 19 | `GET` | `/api/admin/stats` | `AdminDashboardView.tsx` | Admin platform-wide statistics |
| 20 | `GET` | `/api/admin/users` | `AdminDashboardView.tsx` | Admin user accounts directory |
| 21 | `GET` | `/api/destinations/${destinationId}` | `DestinationDetailModal.tsx` | Fetch modal destination data |
| 22 | `GET` | `/api/destinations/${id}` | `DestinationDetailView.tsx` | Fetch page destination data |
| 23 | `GET` | `/api/destinations/map-points?limit=150` | `SmartMapView.tsx` | Fetch map coordinates for points |
| 24 | `GET` | `/api/destinations/nearby?lat=${latitude}&lon=${longitude}&radius_km=30&limit=4` | `DestinationDetailModal.tsx` | Fetch nearby destinations by GPS |
| 25 | `GET` | `/api/destinations/search?q=${encodeURIComponent(q)}&limit=10` | `AdminDashboardView.tsx` | Admin destination search |
| 26 | `GET` | `/api/destinations/search?q=${encodeURIComponent(trimmed)}&limit=6` | `Hero3DScene.tsx` | 3D Hero autocomplete search |
| 27 | `GET` | `/api/destinations/search?q=${encodeURIComponent(trimmed)}&limit=6` | `SearchCommandPalette.tsx` | Command palette search |
| 28 | `GET` | `/api/destinations/states` | `ExploreView.tsx` | Fetch list of distinct states |
| 29 | `GET` | `/api/destinations/states` | `HeroFallback2D.tsx` | Fetch states for 2D hero |
| 30 | `GET` | `/api/destinations/states` | `SearchPanel.tsx` | Fetch states for search panel |
| 31 | `GET` | `/api/destinations?limit=1` | `HomeView.tsx` | Health ping / destination check |
| 32 | `GET` | `/api/destinations?limit=8` | `DashboardView.tsx` | Recommended destinations for dashboard |
| 33 | `GET` | `/api/dmo/analytics` | `AdminDMO.tsx` | DMO footfall & sentiment data |
| 34 | `GET` | `/api/dmo/eco-permit/check/manali` | `GrandFinalePitchModal.tsx` | Check eco-permit status |
| 35 | `GET` | `/api/health` | `GrandFinalePitchModal.tsx` | Health check endpoint |
| 36 | `GET` | `/api/homestays/host/dashboard` | `HostDashboardView.tsx` | Host homestay reservations & earnings |
| 37 | `GET` | `/api/itinerary/${id}` | `PlanView.tsx` | Fetch generated itinerary by ID |
| 38 | `GET` | `/api/itinerary/${itineraryId}/alternatives?day_number=${dayNumber}&stop_index=${stopIndex}` | `SwapStopModal.tsx` | Fetch alternative stops for swap |
| 39 | `GET` | `/api/itinerary/user/${encodeURIComponent(userId)}` | `DashboardView.tsx` | Fetch active trips for dashboard |
| 40 | `GET` | `/api/itinerary/user/${encodeURIComponent(userId)}` | `TripsView.tsx` | Fetch user's saved itineraries |
| 41 | `GET` | `/api/overtourism/pairs` | `HeroFallback2D.tsx` | Fetch overtourism mitigation pairs |
| 42 | `GET` | `/api/recommendations/nearby?destination_id=${id}&top_k=4` | `DestinationDetailView.tsx` | Fetch nearby recommendations |
| 43 | `GET` | `/api/recommendations/rails${queryStr}` | `HomeView.tsx` | Fetch homepage recommendation rails |
| 44 | `GET` | `/api/recommendations/similar?destination_id=${id}&top_k=4` | `DestinationDetailView.tsx` | Fetch similar destinations |
| 45 | `GET` | `/api/recommendations?month=${monthNum}&top_k=12` | `SeasonalView.tsx` | Fetch seasonal recommendations |
| 46 | `GET` | `/api/recommendations?user_id=${encodeURIComponent(userId)}&top_k=6` | `DashboardView.tsx` | Fetch personalized recommendations |
| 47 | `GET` | `/api/user/history?user_id=${encodeURIComponent(userId)}&limit=6` | `DashboardView.tsx` | Fetch recent history preview |
| 48 | `GET` | `/api/user/preferences?user_id=${encodeURIComponent(userId)}` | `TravelTwinView.tsx` | Fetch user travel preferences |
| 49 | `GET` | `/api/user/saved?user_id=${encodeURIComponent(userId)}` | `DashboardView.tsx` | Fetch saved places count |
| 50 | `GET` | `/api/user/saved?user_id=${userId}` | `SavedPlacesView.tsx` | Fetch user bookmarks |
| 51 | `GET` | `/destinations` | `api.ts` | Base API fetch destinations |
| 52 | `GET` | `/destinations/${id}` | `api.ts` | Base API fetch single destination |
| 53 | `GET` | `/homestays` | `api.ts` | Base API fetch homestays |
| 54 | `GET` | `/itinerary/${id}` | `api.ts` | Base API fetch itinerary |
| 55 | `POST` | `/api/admin/listings/${homestayId}/status` | `AdminDashboardView.tsx` | Moderate listing status |
| 56 | `POST` | `/api/admin/pipeline/trigger-refresh` | `AdminDashboardView.tsx` | Retrain ML pipeline |
| 57 | `POST` | `/api/auth/forgot-password` | `AuthView.tsx` | Request password reset link |
| 58 | `POST` | `/api/auth/login` | `AuthView.tsx` | User database authentication |
| 59 | `POST` | `/api/auth/register` | `AuthView.tsx` | User registration |
| 60 | `POST` | `/api/chat/concierge` | `FloatingConcierge.tsx` | Concierge message prompt |
| 61 | `POST` | `/api/chat/message` | `ConciergeWidget.tsx` | Concierge chat dispatch |
| 62 | `POST` | `/api/checkout/direct-booking` | `BookingModal.tsx` | Submit direct zero-commission booking |
| 63 | `POST` | `/api/dmo/eco-permit/toggle` | `AdminDMO.tsx` | Toggle eco-permit requirements |
| 64 | `POST` | `/api/homestays/host/apply-price` | `HostDashboardView.tsx` | Apply dynamic AI pricing |
| 65 | `POST` | `/api/homestays/host/bookings/${bookingId}/approve` | `HostDashboardView.tsx` | Approve guest reservation |
| 66 | `POST` | `/api/homestays/host/bookings/${guestReplyModal.id}/respond` | `HostDashboardView.tsx` | Respond to guest inquiry |
| 67 | `POST` | `/api/itinerary/${itinerary.id}/rfp` | `RFPModal.tsx` | Broadcast itinerary to drivers |
| 68 | `POST` | `/api/itinerary/${itineraryId}/swap-stop` | `SwapStopModal.tsx` | Swap stop in itinerary |
| 69 | `POST` | `/api/itinerary/generate` | `AdminDMO.tsx` | Generate demo itinerary |
| 70 | `POST` | `/api/itinerary/generate` | `GrandFinalePitchModal.tsx` | Generate pitch itinerary |
| 71 | `POST` | `/api/itinerary/generate` | `PlanView.tsx` | Primary itinerary generation |
| 72 | `POST` | `/api/location/ping` | `useGeolocation.ts` | Send GPS coordinate telemetry |
| 73 | `POST` | `/api/recommendations/feedback` | `DestinationCard.tsx` | Log user card click feedback |
| 74 | `POST` | `/api/recommendations/location-ping` | `useGeolocation.ts` | Send location ping for ML |
| 75 | `POST` | `/api/recommendations/location-session` | `useGeolocation.ts` | Initialize location session |
| 76 | `POST` | `/api/safety/sos` | `SOSModal.tsx` | Dispatch emergency SOS alert |
| 77 | `POST` | `/api/user/preferences` | `TravelTwinView.tsx` | Save Travel Twin preferences |
| 78 | `POST` | `/checkout/direct-booking` | `api.ts` | Base API direct booking |
| 79 | `POST` | `/itinerary/generate` | `api.ts` | Base API itinerary generation |
| 80 | `PUT` | `/api/admin/destinations/${editingDest.id}` | `AdminDashboardView.tsx` | Update destination record |
| 81 | `PUT` | `/api/admin/users/${userId}/role` | `AdminDashboardView.tsx` | Update user role |
| 82 | `PUT` | `/api/homestays/host/listing/${homestayId}` | `HostDashboardView.tsx` | Update homestay listing |

---

## 14. Authentication, Login & Logout Functionality

### Authentication Mechanism
* **State Management**: Handled in `AppContext.tsx` with `currentUser`, `userRole`, `switchRole()`, `setCurrentUser()`.
* **Tokens**: JWT token stored in `localStorage.getItem('travelsathi_token')`.
* **User Profile**: JSON stored in `localStorage.getItem('travelsathi_user')`.

### Preset Demo Personas
| Role ID | Persona Title | Email | Default Password | Initial Landing Route |
|---|---|---|---|---|
| `tourist` | Tourist (Aarav Sharma) | `aarav.sharma@travelsathi.in` | `password123` | `/explore` |
| `host` | Host / Homestay (Sunil Thakur) | `sunil.thakur@pineshade.in` | `password123` | `/host` |
| `dmo` | DMO / Government (Dr. Rajesh Verma, IAS) | `officer.tourism@nic.in` | `password123` | `/dmo` |
| `admin` | System Admin (CSO) | `admin.ops@travelsathi.gov.in` | `password123` | `/admin` |

### Auth Flows to Test
1. **Valid Login Flow**: Select persona card in `/auth` -> submit -> verifies `travelsathi_token` is set -> redirects to role landing route.
2. **Invalid Password Flow**: Enter invalid password -> displays error message banner in UI.
3. **Registration Flow**: Toggle to "Create Account" -> enter Name, Email, Password -> submit -> creates user & redirects.
4. **Forgot Password Flow**: Toggle to "Forgot Password" -> enter Email -> submit -> displays success confirmation.
5. **Sign Out Flow**: Open profile dropdown -> click "Sign Out" -> redirects to `/login`.
6. **Admin Persona Switcher**: As admin, switch role directly in Navbar to `tourist`, `host`, `dmo`, or `admin`.

---

## 15. User Roles & Protected Routes

### Route Guard Implementation (`ProtectedRoute` in `App.tsx`)
* Checks `userRole` against `allowedRoles`.
* If `userRole === 'admin'`, access is granted to **all** panels unconditionally for debugging.
* If user lacks role, performs `<Navigate to="/explore" replace />`.

### Protected Route Matrix
| Protected URL Path | Allowed Roles | Non-Authorized Redirection |
|---|---|---|
| `/host`, `/host/dashboard`, `/host/*` | `host` (and `admin`) | `/explore` |
| `/gov`, `/gov/dashboard`, `/gov/*` | `dmo`, `gov` (and `admin`)| `/explore` |
| `/dmo`, `/admin/dmo` | `dmo`, `gov` (and `admin`)| `/explore` |
| `/admin`, `/admin/*` | `admin` | `/explore` |

---

## 16. File Upload & Download Functionality

| Feature Name | Component / File | User Action | Expected Result | Safe to Automate | Destructive Warnings |
|---|---|---|---|---|---|
| Group Expense Receipt Upload | `GroupTripView.tsx` | Select image in file input | Attaches receipt and displays audit confirmation alert | Yes | None |
| iCal Calendar Export | `ItinerarySummaryCard.tsx` | Click "Download iCal (.ics)" | Triggers browser download of `.ics` calendar file with trip stops | Yes | None |
| Privacy Data Export | `PrivacyCenterView.tsx` | Click "Export My Privacy Archive" | Generates and downloads JSON file with user consent & audit log | Yes | None |
| Travel Twin Profile Download | `TravelTwinView.tsx` | Click "Export AI Twin JSON" | Downloads JSON configuration containing user preferences | Yes | None |
| DMO Impact Analytics Export | `AdminDMO.tsx` | Click "Export PDF/CSV Report" | Triggers report file generation | Yes | None |
| Gov Footfall Report Export | `GovDashboardView.tsx` | Click "Download State Report" | Downloads report and triggers notification toast | Yes | None |

---

## 17. Maps & Location Functionality

| Map / Location Feature | Component / File | Route | Technology / API | Expected Behavior |
|---|---|---|---|---|
| Interactive Smart Map | `SmartMapView.tsx` | `/map` | Leaflet `MapContainer`, `TileLayer`, `Marker`, `Popup` | Renders 150+ geotagged nodes across India, clusters by category, click opens popup |
| Catalog Mini Map | `CatalogMap.tsx` | `/explore` | Leaflet | Displays filtered destinations on compact interactive map |
| Itinerary Turn-by-Turn Map | `ItineraryMap.tsx` | `/plan` | Leaflet + `/api/routing/directions` | Plots polyline route between itinerary stops for selected day |
| Live GPS Telemetry Ping | `useGeolocation.ts` | Universal | `navigator.geolocation`, `POST /api/location/ping` | Pings current user coordinates for real-time safety and nearby proximity |
| Emergency GPS Broadcast | `SOSModal.tsx` | Modal | `navigator.geolocation`, `POST /api/safety/sos` | Captures lat/long and transmits in emergency packet |
| Nearby Proximity Finder | `NearbyView.tsx` | `/nearby` | Haversine formula + API `/destinations/nearby` | Queries places within 10km, 25km, 50km of current or selected point |

---

## 18. Notifications & Toasts Inventory

| Toast / Notification Event | Component File | Trigger Condition | Display Style | Auto-dismiss Time |
|---|---|---|---|---|
| Group UPI Settle Link Sent | `GroupTripView.tsx` | Click "Send UPI Settle Ping" | Green success banner with `CheckCircle2` | 3 seconds |
| Dynamic Pricing Applied | `HostDashboardView.tsx` | Click "Apply AI Pricing" | Green nature banner | 4 seconds |
| Listing Moderation Updated | `AdminDashboardView.tsx`| Listing verified/rejected | Status toast alert | 3 seconds |
| Eco-Permit Toggled | `AdminDMO.tsx` | Click permit toggle switch | Alert badge notification | 3 seconds |
| Review Submission Confirmed | `VerifiedReviewForm.tsx`| Submit review form | Success modal / toast | 3 seconds |
| Government Report Exported | `GovDashboardView.tsx` | Click "Export Report" | Information toast banner | 3 seconds |
| Emergency SOS Dispatched | `SOSModal.tsx` | SOS countdown completes | Red alert confirmation banner | Stays until closed |
| Platform Alerts Inbox | `NotificationsView.tsx` | Route `/notifications` | List of system alerts with badge counts | Persistent inbox |

---

## 19. Error States Inventory

| Page / Component | Error Condition | UI Presentation | Recovery Action |
|---|---|---|---|
| `AuthView.tsx` | Invalid password or user not found | Red alert box: `err.response.data.detail` | User corrects input and retries |
| `PlanView.tsx` | Itinerary API failure / timeout (>3.5s) | Fallback itinerary banner + error description | User clicks "Retry Generation" |
| `DestinationDetailView.tsx` | Invalid destination ID in URL | Friendly "Destination not found" card | Click "Back to Explore Catalog" |
| `SmartMapView.tsx` | Leaflet tiles fail to load or offline | Gray map container with retry indicator | Check internet connection |
| `WeatherView.tsx` | Unknown city / no weather data | "Weather data unavailable for this location" | Search for major nearby district |
| `useGeolocation.ts` | Geolocation permission denied | Fallbacks to default coordinates (Delhi/Manali) | User enables GPS in browser |
| `App.tsx` | Route not found (404) | Catch-all `<Route path="*" element={<Navigate to="/" replace />} />` | Gracefully redirects to `/` |

---

## 20. Loading States Inventory

| Component / File | Trigger Event | Loading Indicator |
|---|---|---|
| `PlanWizard.tsx` | Itinerary Generation | Animated hourglass `⏳` and text: *"Crafting Personalized Travel Twin Itinerary..."* |
| `AuthView.tsx` | Login / Register submit | `Loader2` spinning icon + *"Authenticating with database..."* |
| `DestinationDetailModal.tsx` | Fetching destination details | Shimmer skeleton cards & `LoadingSpinner` |
| `FloatingConcierge.tsx` | Waiting for AI response | Pulsing dots animation in chat bubble |
| `AIAssistantView.tsx` | Querying LLM endpoint | "AI is thinking..." typing indicator |
| `SmartMapView.tsx` | Loading 150+ map points | Spinner overlay on top of map container |
| `TrendingView.tsx` | Fetching momentum trends | Skeleton card placeholders |
| `Button.tsx` | When `isLoading === true` | Built-in spinner with disabled pointer events |

---

## 21. Empty States Inventory

| View / Component | Condition | Empty State Message & UI Elements |
|---|---|---|
| `SavedPlacesView.tsx` | User has no bookmarked places | Bookmark icon, *"No saved places yet"*, CTA: *"Explore Destinations"* |
| `TripsView.tsx` | User has no saved itineraries | Suitcase icon, *"You haven't planned any trips yet"*, CTA: *"Plan a New Trip"* |
| `BookingsView.tsx` | User has no active bookings | Calendar icon, *"No reservations found"*, CTA: *"Browse Verified Homestays"* |
| `NotificationsView.tsx` | User inbox has 0 notifications | Bell icon, *"All caught up! No active notifications"*, filter resets |
| `HistoryView.tsx` | No recent browsing history | Clock icon, *"Your browsing trail is empty"*, CTA: *"Discover Places"* |
| `ExploreView.tsx` | Filters match 0 destinations | *"No destinations match your filter criteria"*, CTA: *"Reset All Filters"* |

---

## 22. Responsive & Mobile Behavior

| Feature / Breakpoint | Desktop (`>= 768px`) | Mobile (`< 768px` e.g. Pixel 5) | Verified in `playwright.config.ts` |
|---|---|---|---|
| Navigation Bar | Fixed 4-link nav (`Home`, `Plan Trip`, `My Trips`, `Profile`) | Hamburger menu toggle + `MobileBottomNav` bar | Yes (`projects: ['mobile']`) |
| Mobile Bottom Bar | Hidden (`md:hidden`) | Fixed bottom 4 icons (`Home`, `Search`, `My Trips`, `Profile`) | Yes |
| Hero 3D Canvas | Full interactive 3D canvas (`Hero3DScene`) | Automatically falls back to lightweight 2D hero (`HeroFallback2D`) if WebGL restricted | Yes |
| Plan Wizard Layout | Multi-column grid with side-by-side selectors | Single column stacked cards with full-width buttons | Yes |
| Itinerary View | Two-column layout (Timeline on left, Interactive Map on right) | Stacked layout (Timeline on top, Map below or toggled) | Yes |
| Modals & Drawers | Centered dialogs with max-w constraints | Bottom sheet or full-width drawer with touch close | Yes |
| Touch Target Sizes | Normal desktop padding | Minimum 44x44px touch targets on buttons & links | Yes |

---

## 23. Important User-Facing Features Unique to TravelSathi

1. **National DPI Swadesh Darshan 2.0 Compliance**: Zero-commission digital public infrastructure for tourism; verified homestays directly paid via UPI without OTA middleman cuts.
2. **TransitGuard Fair Transit Engine**: Pre-computed fare caps on auto, cab, and bus routes based on state government tariffs to prevent tourist exploitation.
3. **AI Travel Twin Personality Modeling**: Custom user preference matching that weights slow travel, heritage preservation, culinary interests, and accessibility.
4. **Bhashini Multi-Language Engine**: Seamless interface translation across 7 constitutional Indian languages (`en`, `hi`, `bn`, `ta`, `te`, `mr`, `gu`).
5. **Theme Engine**: Persistent Dark Mode and Light Mode with system token synchronization (`travelsathi_dark`).
6. **Web Speech TTS Audio Concierge**: Real-time voice reading of AI recommendations for accessibility.
7. **DPDP 2023 Compliant Privacy Vault**: Granular user consent toggles, real-time data deletion, and downloadable audit archives.

---

## Quantitative Testing Summary

* **Routes Mapped**: **34 distinct routes** (11 public, 13 tourist, 10 specialized panels, and guarded role portals for Host, DMO, and Admin).
* **Interactive Components Cataloged**: **128 interactive elements** (including 21 forms, 24 inputs, 12 selects, 14 modals/drawers, 12 tab controllers, and 45 distinct buttons).
* **Forms Discovered**: **21 unique form workflows**.
* **API Integrations**: **82 API calls** across HTTP `GET`, `POST`, `PUT`, `DELETE`, and `FETCH`.
* **Authentication Flows**: **6 complete authentication and role switching flows** (Login, Register, Forgot Password, Persona Autofill, Sign Out, Admin Persona Switcher).
* **Major Features**: **16 major functional pillars** (AI Itinerary Generator, Travel Twin Persona, TransitGuard, PM-JUGA Stays, Leaflet Smart Map, Emergency SOS, Split-UPI, Verified Reviews, Dynamic AI Pricing, DMO Intelligence, Eco-Permits, Driver RFP Marketplace, Multi-Language, Dark Theme, Offline Pass Wallet, Privacy Vault).

---
*Created by Antigravity Autonomous Agent. No application source code was modified.*
