import sqlite3
import json
import os
import sys
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.potential_score_service import (
    WEIGHTS,
    calculate_destination_potential
)

def run_scoring_pipeline():
    conn = sqlite3.connect('travelsathi_dev.db')
    c = conn.cursor()

    print("1. Fetching all destinations...")
    c.execute('SELECT id, name, state, category, is_hidden_gem, heritage_status FROM destinations_master')
    raw_dests = c.fetchall()
    all_dests = [
        {
            'id': r[0],
            'name': r[1],
            'state': r[2],
            'category': r[3],
            'is_hidden_gem': bool(r[4]),
            'heritage_status': r[5]
        }
        for r in raw_dests
    ]
    print(f"   -> Loaded {len(all_dests)} destinations.")

    print("2. Fetching destination interactions...")
    c.execute('SELECT destination_id, interaction_type, created_at FROM destination_interactions')
    raw_interactions = c.fetchall()
    interactions_list = [
        {'destination_id': r[0], 'interaction_type': r[1], 'created_at': r[2]}
        for r in raw_interactions
    ]
    print(f"   -> Loaded {len(interactions_list)} interactions.")

    print("3. Fetching destination transport maps...")
    c.execute('SELECT destination_id, nearest_airport_km, nearest_railway_km, nearest_highway_km FROM destination_transport')
    raw_trans = c.fetchall()
    transport_map = {
        r[0]: {
            'nearest_airport_km': r[1],
            'nearest_railway_km': r[2],
            'nearest_highway_km': r[3]
        }
        for r in raw_trans
    }
    print(f"   -> Loaded {len(transport_map)} transport records.")

    print("4. Fetching monthly visits maps...")
    c.execute('SELECT destination_id, month, visit_index FROM destination_monthly_visits')
    raw_monthly = c.fetchall()
    monthly_map = {}
    for d_id, month, v_idx in raw_monthly:
        if d_id not in monthly_map:
            monthly_map[d_id] = {}
        monthly_map[d_id][month] = v_idx
    print(f"   -> Loaded monthly records for {len(monthly_map)} destinations.")

    print("5. Executing scoring algorithm with full row error isolation...")
    updates = []
    errors = []
    
    for dest in all_dests:
        try:
            d_id = dest['id']
            trans_row = transport_map.get(d_id)
            monthly_visits = monthly_map.get(d_id)

            res = calculate_destination_potential(
                dest=dest,
                all_dests=all_dests,
                interactions_list=interactions_list,
                transport_row=trans_row,
                monthly_visits=monthly_visits
            )

            score = res['potential_score']
            assert 0.0 <= score <= 100.0, f"Score out of bounds: {score} for dest {d_id}"

            updates.append((
                score,
                json.dumps(res['score_breakdown']),
                res['score_confidence'],
                res['score_computed_at'],
                d_id
            ))
        except Exception as e:
            errors.append({'destination_id': dest.get('id'), 'error': str(e)})

    print(f"   -> Computed {len(updates)} scores successfully. Errors: {len(errors)}")

    print("6. Batch updating destinations_master table...")
    c.executemany('''
        UPDATE destinations_master
        SET potential_score = ?,
            score_breakdown = ?,
            score_confidence = ?,
            score_computed_at = ?
        WHERE id = ?
    ''', updates)

    conn.commit()
    print(f"Scored and updated {len(updates)}/{len(all_dests)} destinations. {len(errors)} errors: {errors}")

    # Summary verification
    c.execute('SELECT AVG(potential_score), MIN(potential_score), MAX(potential_score) FROM destinations_master WHERE potential_score IS NOT NULL')
    avg_s, min_s, max_s = c.fetchone()
    print(f"Database Stats -> Avg: {round(avg_s, 2)}, Min: {min_s}, Max: {max_s}")

    c.execute('SELECT score_confidence, COUNT(*) FROM destinations_master GROUP BY score_confidence')
    print("Confidence breakdown:", c.fetchall())

if __name__ == '__main__':
    run_scoring_pipeline()
