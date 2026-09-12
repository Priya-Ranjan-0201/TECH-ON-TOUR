"""
Tech-On-Tour Co-Search Graph Recommendation Engine.
Ingests 17,891 semantic co-search relations and grounds them to 12,293 verified destinations.
Provides:
- Semantic search term association lookup
- Co-visited / related place recommendation
- Graph-grounded contextual ranking for AI Concierge & Itinerary Builder
"""

import os
import csv
import logging
from collections import defaultdict
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger("graph_recommender")

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
PLACES_CSV = BASE_DIR / "data" / "places.csv"
SEARCH_CSV = BASE_DIR / "data" / "search_graph" / "related_searches.csv"

# Fallback check
if not PLACES_CSV.exists():
    PLACES_CSV = BASE_DIR / "Tech-On-Tour" / "data" / "places.csv"
if not SEARCH_CSV.exists():
    SEARCH_CSV = BASE_DIR / "Tech-On-Tour" / "data" / "search_graph" / "related_searches.csv"


class GraphRecommender:
    def __init__(self):
        self.places_by_id: Dict[int, Dict[str, Any]] = {}
        self.term_to_place_ids: Dict[str, List[int]] = defaultdict(list)
        self.place_id_to_terms: Dict[int, List[str]] = defaultdict(list)
        self.place_neighbors: Dict[int, List[int]] = defaultdict(list)
        self.is_loaded = False
        self._load_graph()

    def _load_graph(self):
        try:
            # 1. Load Places Catalog
            if PLACES_CSV.exists():
                with open(PLACES_CSV, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        pid = int(row["id"])
                        self.places_by_id[pid] = {
                            "id": pid,
                            "name": row["name"],
                            "state": row["state"],
                            "category": row["category"],
                            "rating": float(row.get("rating", 4.0)),
                            "review_count": int(row.get("review_count", 0)),
                            "price_range": row.get("price_range", "mid"),
                            "best_season": row.get("best_season", "All Year"),
                            "image_url": row.get("image_url", ""),
                            "latitude": float(row.get("latitude", 0.0)),
                            "longitude": float(row.get("longitude", 0.0))
                        }
                logger.info(f"Loaded {len(self.places_by_id)} places into GraphRecommender")

            # 2. Load Search Graph Edges (17,891 edges)
            if SEARCH_CSV.exists():
                with open(SEARCH_CSV, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        raw_pid = int(row["place_id"])
                        # Map 0-indexed place_id to places.csv 1-indexed primary key
                        pid = raw_pid + 1 if raw_pid in self.places_by_id else (raw_pid if raw_pid in self.places_by_id else None)
                        if pid is None and (raw_pid + 1) in self.places_by_id:
                            pid = raw_pid + 1
                        
                        term = row["associated_search_term"].strip()
                        if term and pid:
                            term_lower = term.lower()
                            self.term_to_place_ids[term_lower].append(pid)
                            self.place_id_to_terms[pid].append(term)

                # 3. Compute 2-hop Co-Search Neighbors
                for term_lower, pids in self.term_to_place_ids.items():
                    if len(pids) > 1:
                        for p1 in pids:
                            for p2 in pids:
                                if p1 != p2 and p2 not in self.place_neighbors[p1]:
                                    self.place_neighbors[p1].append(p2)

                self.is_loaded = True
                logger.info(f"Loaded {len(self.term_to_place_ids)} search terms into Co-Search Graph")
        except Exception as e:
            logger.error(f"Failed loading search graph: {e}")

    def search_by_term(self, query: str, limit: int = 6) -> List[Dict[str, Any]]:
        """
        Finds destinations directly associated with the search query via graph edges.
        """
        if not self.is_loaded or not query:
            return []
            
        q_lower = query.lower().strip()
        matched_place_ids = []
        
        # 1. Exact or substring match in graph terms
        for term, pids in self.term_to_place_ids.items():
            if q_lower in term or term in q_lower:
                for pid in pids:
                    if pid not in matched_place_ids:
                        matched_place_ids.append(pid)
                    if len(matched_place_ids) >= limit * 2:
                        break
            if len(matched_place_ids) >= limit * 2:
                break
                
        results = []
        for pid in matched_place_ids[:limit]:
            if pid in self.places_by_id:
                place = dict(self.places_by_id[pid])
                place["associated_terms"] = self.place_id_to_terms.get(pid, [])[:3]
                results.append(place)
                
        return results

    def get_related_destinations(self, place_id: int, limit: int = 4) -> List[Dict[str, Any]]:
        """
        Returns co-searched neighboring destinations linked via graph edges.
        """
        if not self.is_loaded:
            return []
            
        neighbors = self.place_neighbors.get(place_id, [])
        if not neighbors:
            # Fallback to same-state high-rated places
            curr_place = self.places_by_id.get(place_id)
            if curr_place:
                state = curr_place["state"]
                neighbors = [
                    p["id"] for p in self.places_by_id.values() 
                    if p["state"] == state and p["id"] != place_id
                ][:limit]
                
        results = []
        for pid in neighbors[:limit]:
            if pid in self.places_by_id:
                results.append(self.places_by_id[pid])
        return results

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_destinations": len(self.places_by_id),
            "total_graph_edges": sum(len(terms) for terms in self.place_id_to_terms.values()),
            "unique_search_terms": len(self.term_to_place_ids),
            "status": "ready" if self.is_loaded else "uninitialized"
        }

# Global singleton
graph_recommender = GraphRecommender()
