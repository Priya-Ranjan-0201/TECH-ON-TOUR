# 🌍 Tech On Tour — National Tourism Dataset & Knowledge Graph

[![Verified Destinations](https://img.shields.io/badge/Verified%20Destinations-12%2C293-blue?style=flat-square&logo=googlemaps)](data/places.csv)
[![States & UTs](https://img.shields.io/badge/States%20%26%20UTs-36%20All--India-green?style=flat-square)](data/states)
[![Districts Covered](https://img.shields.io/badge/Districts-737-orange?style=flat-square)](#)
[![Search Relations](https://img.shields.io/badge/Graph%20Edges-17%2C891-purple?style=flat-square)](data/search_graph/related_searches.csv)
[![Data Parity](https://img.shields.io/badge/Mathematical%20Parity-100%25-success?style=flat-square)](#)
[![Data Quality](https://img.shields.io/badge/Null%20Cells-0%20(Pristine)-brightgreen?style=flat-square)](#)

Tech On Tour is India's most comprehensive, verified, and normalized open geospatial tourism dataset and co-search recommendation graph. Developed for the **Smart India Hackathon (SIH)**, it catalogs **12,293 verified tourist destinations** across all **28 States and 8 Union Territories** (737 districts) with a 100% zero-null data quality guarantee and zero placeholder entries.

---

## 📊 Dataset Overview & Key Metrics

| Metric | Master Count | Description |
| :--- | :---: | :--- |
| **Total Verified Destinations** | **12,293** | Master national index (`data/places.csv`) |
| **Unique Destination Names** | **12,202** | Deduplicated across all regional districts |
| **State Destinations** | **11,147** | 28 States (`data/states/`) |
| **Union Territory Destinations** | **1,146** | 8 Union Territories (`data/union_territories/`) |
| **Sum Parity (`States + UTs == Master`)** | **100%** | Exact mathematical equality (`11,147 + 1,146 = 12,293`) |
| **Bidirectional Set Parity** | **0 Discrepancy** | Every master row exists in its region; every regional row exists in master |
| **Districts Covered** | **737** | Comprehensive nationwide district coverage |
| **Search Graph Relations** | **17,891** | Semantic and co-search association pairs (`data/search_graph/related_searches.csv`) |
| **Null / Incomplete Cells** | **0** | Zero missing values across all 73,758 data cells |

---

## 📐 Normalized 6-Tier Schema Architecture

Every destination record across the master catalog and regional files follows a strict, standardized 6-column taxonomy:

```csv
place_name,state_ut,district,city_or_town,nearest_major_city,category
```

| Column | Data Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `place_name` | String | Verified official name of the tourist destination | `Golconda Fort` |
| `state_ut` | String | Official Indian State or Union Territory | `Telangana` |
| `district` | String | Official revenue district of India | `Hyderabad` |
| `city_or_town` | String | Local town, tehsil, or municipal settlement | `Hyderabad` |
| `nearest_major_city` | String | Major transit hub (airport, railway junction) | `Hyderabad` |
| `category` | String | Thematic tourist classification | `Fort` |

---

## 🗺️ State & Union Territory Directory

### 🇮🇳 28 States (`11,147` places)

| State | Places | State | Places |
| :--- | :---: | :--- | :---: |
| [Andhra Pradesh](data/states/Andhra_Pradesh/places.csv) | 229 | [Maharashtra](data/states/Maharashtra/places.csv) | 1,473 |
| [Arunachal Pradesh](data/states/Arunachal_Pradesh/places.csv) | 126 | [Manipur](data/states/Manipur/places.csv) | 332 |
| [Assam](data/states/Assam/places.csv) | 623 | [Meghalaya](data/states/Meghalaya/places.csv) | 137 |
| [Bihar](data/states/Bihar/places.csv) | 617 | [Mizoram](data/states/Mizoram/places.csv) | 39 |
| [Chhattisgarh](data/states/Chhattisgarh/places.csv) | 209 | [Nagaland](data/states/Nagaland/places.csv) | 743 |
| [Goa](data/states/Goa/places.csv) | 142 | [Odisha](data/states/Odisha/places.csv) | 236 |
| [Gujarat](data/states/Gujarat/places.csv) | 222 | [Punjab](data/states/Punjab/places.csv) | 299 |
| [Haryana](data/states/Haryana/places.csv) | 164 | [Rajasthan](data/states/Rajasthan/places.csv) | 296 |
| [Himachal Pradesh](data/states/Himachal_Pradesh/places.csv) | 245 | [Sikkim](data/states/Sikkim/places.csv) | 200 |
| [Jharkhand](data/states/Jharkhand/places.csv) | 173 | [Tamil Nadu](data/states/Tamil_Nadu/places.csv) | 1,572 |
| [Karnataka](data/states/Karnataka/places.csv) | 790 | [Telangana](data/states/Telangana/places.csv) | 596 |
| [Kerala](data/states/Kerala/places.csv) | 231 | [Tripura](data/states/Tripura/places.csv) | 216 |
| [Madhya Pradesh](data/states/Madhya_Pradesh/places.csv) | 266 | [Uttar Pradesh](data/states/Uttar_Pradesh/places.csv) | 233 |
| | | [Uttarakhand](data/states/Uttarakhand/places.csv) | 190 |
| | | [West Bengal](data/states/West_Bengal/places.csv) | 548 |

### 🏛️ 8 Union Territories (`1,146` places)

| Union Territory | Places | Union Territory | Places |
| :--- | :---: | :--- | :---: |
| [Andaman & Nicobar Islands](data/union_territories/Andaman_and_Nicobar_Islands/places.csv) | 53 | [Jammu & Kashmir](data/union_territories/Jammu_and_Kashmir/places.csv) | 146 |
| [Chandigarh](data/union_territories/Chandigarh/places.csv) | 175 | [Ladakh](data/union_territories/Ladakh/places.csv) | 85 |
| [Dadra & Nagar Haveli and Daman & Diu](data/union_territories/Dadra_and_Nagar_Haveli_and_Daman_and_Diu/places.csv) | 107 | [Lakshadweep](data/union_territories/Lakshadweep/places.csv) | 126 |
| [Delhi](data/union_territories/Delhi/places.csv) | 396 | [Puducherry](data/union_territories/Puducherry/places.csv) | 58 |

---

## 🏷️ Top Thematic Categories

| Category | Destinations | Category | Destinations |
| :--- | :---: | :--- | :---: |
| **Heritage** | 1,812 | **Cultural / Culture** | 959 |
| **Nature** | 1,670 | **Fort** | 387 |
| **Temple** | 1,504 | **Waterfall** | 378 |
| **Religious / Spiritual** | 740 | **Recreation** | 362 |
| **Lake / Water Body** | 606 | **Beach** | 299 |
| **Wildlife / Sanctuary** | 579 | **Hill Station / Viewpoint** | 260+ |

---

## 🕸️ Search & Recommendation Graph

The repository includes a dedicated co-search association graph at `data/search_graph/related_searches.csv` containing **17,891 relations**:
- **Schema**: `place_id,associated_search_term,search_weight`
- **Application**: Powers autocomplete, related destination queries, semantic search, and cross-corridor exploration in travel planners.

---

## 📁 Repository Structure

```text
Tech-On-Tour/
├── data/
│   ├── places.csv                           # National master dataset (12,293 verified records)
│   ├── search_graph/
│   │   └── related_searches.csv             # Recommendation graph (17,891 edges)
│   ├── states/                              # 28 State subdirectories (11,147 records)
│   │   ├── Andhra_Pradesh/places.csv
│   │   ├── ...
│   │   └── West_Bengal/places.csv
│   └── union_territories/                   # 8 Union Territory subdirectories (1,146 records)
│       ├── Andaman_and_Nicobar_Islands/places.csv
│       ├── ...
│       └── Puducherry/places.csv
├── scripts/
│   └── comprehensive_audit.py               # Complete automated validation & parity suite
├── .gitignore
└── README.md                                # Project & dataset documentation
```

---

## 🧪 Automated Verification & Quality Audit

A comprehensive verification script is provided to audit all 37 CSV files for data integrity, zero nulls, and exact parity.

```powershell
python scripts/comprehensive_audit.py
```

### Audit Guarantees:
- ✅ **100% Mathematical Parity**: Regional sum (`11,147 + 1,146`) equals master (`12,293`).
- ✅ **Bidirectional Integrity**: `set(Master) == set(Regional)` with 0 orphaned records.
- ✅ **Zero Missing Values**: Every row contains valid non-empty entries for all 6 columns.
- ✅ **Clean Encoding**: UTF-8 format without BOM headers, unescaped HTML entities, or trailing whitespace.

---

## 💻 Quick Start & Data Ingestion

### Python (Pandas)
```python
import pandas as pd

# Load master national dataset
df = pd.read_csv("data/places.csv")
print(f"Loaded {len(df):,} destinations across {df['state_ut'].nunique()} States/UTs.")

# Filter destinations in a specific state
bihar_places = df[df["state_ut"] == "Bihar"]
print(bihar_places.head())
```

### Node.js / JavaScript
```javascript
const fs = require('fs');
const readline = require('readline');

const stream = fs.createReadStream('data/places.csv');
const rl = readline.createInterface({ input: stream });

let count = 0;
rl.on('line', (line) => {
  count++;
});
rl.on('close', () => {
  console.log(`Total records: ${count - 1}`); // 12,293 destinations
});
```
