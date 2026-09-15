import pytest
from app.services.potential_score_service import (
    WEIGHTS,
    significance,
    accessibility,
    calculate_destination_potential
)

def test_weights_sum_to_one():
    assert abs(sum(WEIGHTS.values()) - 1.0) < 0.001

def test_score_bounds():
    sample_dests = [
        {'id': 1, 'name': 'Taj Mahal', 'state': 'Uttar Pradesh', 'category': 'attraction', 'is_hidden_gem': False, 'heritage_status': 'unesco'},
        {'id': 2, 'name': 'Undavalli Caves', 'state': 'Andhra Pradesh', 'category': 'attraction', 'is_hidden_gem': True, 'heritage_status': 'asi_protected'},
        {'id': 3, 'name': 'Remote Hill Peak', 'state': 'Himachal Pradesh', 'category': 'nature', 'is_hidden_gem': True, 'heritage_status': 'unlisted'},
        {'id': 4, 'name': 'Local City Museum', 'state': 'Delhi', 'category': 'attraction', 'is_hidden_gem': False, 'heritage_status': 'state_recognized'},
        {'id': 5, 'name': 'Blank Fields POI', 'state': 'Goa', 'category': 'attraction', 'is_hidden_gem': False, 'heritage_status': None}
    ]
    
    sample_transport = {'nearest_airport_km': 15.0, 'nearest_railway_km': 5.0, 'nearest_highway_km': 2.0}
    sample_monthly = {1: 10.0, 2: 10.0, 3: 10.0, 4: 8.0, 5: 6.0, 6: 4.0, 7: 4.0, 8: 6.0, 9: 8.0, 10: 10.0, 11: 12.0, 12: 12.0}

    for d in sample_dests:
        result = calculate_destination_potential(
            dest=d,
            all_dests=sample_dests,
            interactions_list=[],
            transport_row=sample_transport if d['id'] != 5 else None,
            monthly_visits=sample_monthly if d['id'] != 5 else None
        )
        score = result['potential_score']
        assert 0.0 <= score <= 100.0, f"Score out of bounds: {score} for {d['name']}"
        assert result['score_confidence'] in ['bootstrap', 'partial', 'full']

def test_no_crash_on_missing_heritage_status():
    dest = {'id': 999, 'heritage_status': None}
    score, flag = significance(dest)
    assert score == 0.1 and flag is not None

def test_no_crash_on_missing_transport():
    score, flag = accessibility({}, None)
    assert score == 0.3 and flag == 'no_transport_data'
