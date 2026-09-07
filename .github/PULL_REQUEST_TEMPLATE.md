## 📝 Summary of Changes

*Briefly describe what destinations or corrections are included in this PR.*

---

## 📋 Quality & Schema Checklist

Before submitting, please ensure you have checked the following:

- [ ] All records follow the 6-tier schema: `place_name,state_ut,district,city_or_town,nearest_major_city,category`
- [ ] No empty or blank cells exist (`0 nulls`)
- [ ] Added destinations are recorded in BOTH the regional state file and master `data/places.csv`
- [ ] Ran `python scripts/comprehensive_audit.py` locally with **0 issues found**
- [ ] No generic placeholder titles (e.g. "countryside", "landscape") are used
