# Tourist Attraction Search Graph & Associations

This directory hosts the co-search associations dataset (related_searches.csv) connecting tourist attractions across India.


## Dataset Details
- **File**: related_searches.csv
- **Total Records**: 17,891 association pairs
- **Purpose**: Captures real-world traveler navigation, interest clustering, and tourist discovery pathways ("People Also Search For") across 3,678 tourist hub clusters.


## Schema1. `place_id`: Integer identifier referencing tourist hub clusters.
2. `associated_search_term`: Specific tourist attraction, monument, scenic viewpoint, or related travel entity frequently co-searched by visitors.
3. `search_weight`: Co-search relevance frequency weight (integer).
