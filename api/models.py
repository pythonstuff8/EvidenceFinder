from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class SourceType(str, Enum):
    NEWS = "news"
    ACADEMIC = "academic"
    GOVERNMENT = "government"
    ORGANIZATION = "organization"
    BLOG = "blog"
    OTHER = "other"


class SearchRequest(BaseModel):
    query: str
    source_types: Optional[List[SourceType]] = None


class EvidenceCard(BaseModel):
    id: str
    title: str
    link: str
    snippet: str
    description: str
    relation_to_claim: str
    source_type: SourceType
    relevance_score: float


class SearchResponse(BaseModel):
    query: str
    evidence_cards: List[EvidenceCard]
    total_results: int
