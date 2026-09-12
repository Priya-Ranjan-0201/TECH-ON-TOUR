# 🤝 Contributing to Tech On Tour

Thank you for your interest in contributing to **Tech On Tour**! Our mission is to build India's most accurate, comprehensive, and verified open geospatial tourism dataset and knowledge graph.

---

## 📋 Standardized 6-Tier Schema

All destination records must strictly adhere to the 6-tier schema:

```csv
place_name,state_ut,district,city_or_town,nearest_major_city,category
```

1. **`place_name`**: Official or locally established title of the destination (e.g. `Punaura Dham (Mata Sita Janmasthali Mandir)`). Avoid vague generic titles like `"countryside"` or `"landscape"`.
2. **`state_ut`**: Official State or Union Territory name (e.g. `Bihar`, `Telangana`).
3. **`district`**: Official revenue district of India (e.g. `Sitamarhi`, `Hyderabad`).
4. **`city_or_town`**: Local municipality, block, or village settlement (e.g. `Dumra`).
5. **`nearest_major_city`**: Major railway junction, airport hub, or metropolitan center (e.g. `Muzaffarpur`).
6. **`category`**: Primary thematic category (e.g. `Heritage`, `Nature`, `Temple`, `Wildlife`, `Lake`, `Waterfall`, `Fort`, `Beach`, `Cave`, `Viewpoint`, `Village`, `Adventure`).

---

## 🛠️ Contribution Workflow

1. **Fork & Branch**:
   ```bash
   git checkout -b feat/add-destinations-<state>
   ```

2. **Add Destinations**:
   - Add new places to the appropriate regional file under `data/states/<State>/places.csv` or `data/union_territories/<UT>/places.csv`.
   - Also append the same record to `data/places.csv` to maintain 100% mathematical parity.

3. **Verify Integrity Locally**:
   Before committing, run the automated verification suite:
   ```bash
   python scripts/comprehensive_audit.py
   ```
   Ensure:
   - ✅ **Total Quality Issues Found: 0**
   - ✅ **Zero empty / missing cells**
   - ✅ **Parity Match (Regional == Master): True**

4. **Submit Pull Request**:
   - Push your branch and open a Pull Request with a brief description of the destinations and geographic references.
   - The GitHub Actions CI pipeline will automatically run and validate your submission.
