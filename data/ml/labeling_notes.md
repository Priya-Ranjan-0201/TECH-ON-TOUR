# Review Authenticity Dataset: Labeling Notes & Methodology

**Author:** TravelSathi Machine Learning Engineering  
**Dataset:** 180 Labeled Travel & Homestay Reviews (Indian Cultural Tourism Context)  
**Task:** Binary Classification — `is_genuine` (1: Genuine Experiential Review, 0: Likely Fake / Generic / Astroturfed)  
**Supervision Strategy:** Documented Manual Weak-Supervision on Curated Indian Travel Review Scenarios  

---

## 1. Why Weak Supervision / Hand-Labeled Ground Truth?

In commercial travel platforms (TripAdvisor, Google Maps, MakeMyTrip), true "fake review" ground truth is almost never available because bad actors do not disclose their astroturfing campaigns. Rather than training a model on an unverified web-scraped dataset with unknown labeling fidelity, we curated and labeled a representative set of 180 reviews with documented criteria. 

This is explicitly disclosed as a **weakly-supervised, manually-audited benchmark** for hackathon and audit evaluation.

---

## 2. Labeling Taxonomy & Criteria

Each review was evaluated against 4 primary diagnostic dimensions:

### Dimension A: Specificity & Experiential Anchors
* **Genuine (1):** Mentions concrete, verifiable details such as:
  - Specific staff or host names (*"Ramesh the guide", "Auntie Meena", "Captain Dorje"*).
  - Room architectural specifics (*"Room 204 corner balcony", "cedarwood attic ceiling", "first-floor courtyard"*).
  - Specific local dishes or cultural elements (*"homemade Siddu with ghee", "Kahwa tea in bronze samovar", "Bastar Mahua brew"*).
  - Travel context (*"steep 20-minute descent from the highway", "morning fog over the Tungabhadra"*).
* **Fake/Generic (0):** Lacks any distinguishing anchor. Could be copy-pasted into any hotel in the world (*"Superb stay, loved everything, very good hospitality"*).

### Dimension B: Rating-Sentiment Coherence
* **Genuine (1):** Star rating matches textual tone. A 4.0 star review acknowledges a minor flaw (*"Great mountain view, though hot water was intermittent in the morning"*).
* **Fake/Generic (0):** Strong mismatch:
  - 5-star rating with neutral or frustrated wording.
  - 1-star rating with cheerful or generic words (*"Loved it! 1 star"* — typical bot/misclick pattern).

### Dimension C: Generic Buzzword Density
* **Genuine (1):** Organic vocabulary with diverse sentence length.
* **Fake/Generic (0):** Packed with stock promotional clichés (*"great place", "highly recommend", "value for money", "must visit", "will visit again"*), often in clusters of 3+ clichés within a single 15-word review.

### Dimension D: Punctuation & Astroturfing Clues
* **Genuine (1):** Natural punctuation.
* **Fake/Generic (0):** Excessive exclamation marks (*"Best place in India!!!!!!"*) or contact/promo calls (*"Call Ramesh on WhatsApp for 20% off"*).

---

## 3. Class Balance
- **Genuine Reviews (1):** 108 samples (60.0%)
- **Fake/Generic Reviews (0):** 72 samples (40.0%)
- Total: 180 labeled samples

---

## 4. Serving Fallback Policy
If the ML model cannot be loaded or inference fails at runtime, TravelSathi does **NOT** guess or invent a fake badge. An **absent trust badge** is honest; a false trust badge compromises safety.
