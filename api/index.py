import os
import uuid
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
from typing import List

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

# Load environment variables
load_dotenv()

SERPER_API_KEY = os.getenv("SERPER_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = FastAPI(
    title="Evidence Finder API",
    description="API for finding evidence for claims and questions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY)


def classify_source_type(url: str, title: str) -> SourceType:
    """Classify the source type based on URL and title"""
    url_lower = url.lower()
    title_lower = title.lower()
    
    # Academic sources
    academic_domains = ['.edu', 'scholar.google', 'arxiv.org', 'pubmed', 'jstor', 
                       'sciencedirect', 'springer', 'wiley', 'nature.com', 'science.org',
                       'researchgate', 'academia.edu']
    if any(domain in url_lower for domain in academic_domains):
        return SourceType.ACADEMIC
    
    # Government sources
    gov_domains = ['.gov', '.mil', 'who.int', 'un.org', 'europa.eu', 'parliament']
    if any(domain in url_lower for domain in gov_domains):
        return SourceType.GOVERNMENT
    
    # News sources
    news_domains = ['news', 'reuters', 'bbc', 'cnn', 'nytimes', 'washingtonpost', 
                   'guardian', 'forbes', 'wsj', 'bloomberg', 'apnews', 'npr',
                   'politico', 'axios', 'thehill']
    if any(domain in url_lower for domain in news_domains):
        return SourceType.NEWS
    
    # Organization sources
    org_domains = ['.org', 'foundation', 'institute', 'association']
    if any(domain in url_lower for domain in org_domains):
        return SourceType.ORGANIZATION
    
    # Blog sources
    blog_indicators = ['blog', 'medium.com', 'substack', 'wordpress', 'tumblr']
    if any(indicator in url_lower for indicator in blog_indicators):
        return SourceType.BLOG
    
    return SourceType.OTHER


async def search_serper(query: str) -> List[dict]:
    """Search using Serper API"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": SERPER_API_KEY,
                "Content-Type": "application/json"
            },
            json={
                "q": query + " evidence research study",
                "num": 10
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Serper API error")
        
        data = response.json()
        return data.get("organic", [])


def analyze_evidence_with_openai(query: str, search_results: List[dict]) -> List[dict]:
    """Use OpenAI to analyze and describe the evidence"""
    if not search_results:
        return []
    
    # Prepare context for OpenAI
    results_text = "\n".join([
        f"Title: {r.get('title', 'N/A')}\nURL: {r.get('link', 'N/A')}\nSnippet: {r.get('snippet', 'N/A')}\n"
        for r in search_results[:8]  # Limit to avoid token limits
    ])
    
    prompt = f"""Analyze the following search results as evidence for the claim/question: "{query}"

For each result, provide:
1. A detailed description of what the evidence says (exactly 3-4 full sentences). Do not use ellipses or placeholders.
2. How it relates to the claim/question (supports, contradicts, provides context, etc.)
3. A relevance score from 0.0 to 1.0

Search Results:
{results_text}

Respond in JSON format as an array:
[{{"index": 0, "description": "Full detailed description here", "relation": "Relationship description here", "relevance_score": 0.95}}, ...]
Only include results that have meaningful evidence. Return valid JSON only. Do not truncate the description."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert fact-checker and evidence analyst. Analyze search results and determine their relevance as evidence."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        import json
        content = response.choices[0].message.content
        # Clean up response - remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        return json.loads(content)
    except Exception as e:
        print(f"OpenAI analysis error: {e}")
        # Return basic analysis if OpenAI fails
        return [
            {"index": i, "description": r.get("snippet", ""), "relation": "Related to query", "relevance_score": 0.5}
            for i, r in enumerate(search_results)
        ]


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Evidence Finder API is running"}


@app.get("/api/source-types")
async def get_source_types():
    """Get available source types for filtering"""
    return {
        "source_types": [
            {"value": st.value, "label": st.value.replace("_", " ").title()}
            for st in SourceType
        ]
    }


@app.post("/api/search", response_model=SearchResponse)
async def search_evidence(request: SearchRequest):
    """Search for evidence related to a claim or question"""
    
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    # Search using Serper
    search_results = await search_serper(request.query)
    
    if not search_results:
        return SearchResponse(
            query=request.query,
            evidence_cards=[],
            total_results=0
        )
    
    # Analyze with OpenAI
    analysis = analyze_evidence_with_openai(request.query, search_results)
    
    # Build evidence cards
    evidence_cards = []
    for i, result in enumerate(search_results):
        # Find corresponding analysis
        result_analysis = next((a for a in analysis if a.get("index") == i), None)
        
        if result_analysis is None:
            continue
        
        source_type = classify_source_type(
            result.get("link", ""),
            result.get("title", "")
        )
        
        # Apply source type filter if specified
        if request.source_types and source_type not in request.source_types:
            continue
        
        evidence_cards.append(EvidenceCard(
            id=str(uuid.uuid4()),
            title=result.get("title", "Untitled"),
            link=result.get("link", ""),
            snippet=result.get("snippet", ""),
            description=result_analysis.get("description", result.get("snippet", "")),
            relation_to_claim=result_analysis.get("relation", "Related"),
            source_type=source_type,
            relevance_score=float(result_analysis.get("relevance_score", 0.5))
        ))
    
    # Sort by relevance score
    evidence_cards.sort(key=lambda x: x.relevance_score, reverse=True)
    
    return SearchResponse(
        query=request.query,
        evidence_cards=evidence_cards,
        total_results=len(evidence_cards)
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
