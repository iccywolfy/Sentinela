"""Unit tests for SENTINELA NLP Service"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Patch spaCy before importing main to avoid needing en_core_web_sm in test env
with patch('spacy.load', return_value=MagicMock()):
    from main import app

client = TestClient(app)


def test_health():
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


def test_detect_language_english():
    response = client.post('/api/v1/detect-language', json={'text': 'Military tensions escalate in eastern Europe'})
    assert response.status_code == 200
    data = response.json()
    assert data['language'] == 'en'
    assert data['confidence'] > 0


def test_detect_language_cyrillic():
    response = client.post('/api/v1/detect-language', json={'text': 'Военные учения проходят на Украине'})
    assert response.status_code == 200
    data = response.json()
    assert data['language'] == 'ru'


def test_classify_domain_military():
    response = client.post('/api/v1/classify-domain', json={
        'text': 'Army troops deployed along the border following military escalation and weapons build-up',
        'language': 'en'
    })
    assert response.status_code == 200
    data = response.json()
    assert data['domain'] in ['MILITARY', 'GEOPOLITICAL']
    assert 0 <= data['confidence'] <= 1


def test_classify_domain_cyber():
    response = client.post('/api/v1/classify-domain', json={
        'text': 'Ransomware attack disrupted hospital network systems causing data breach',
        'language': 'en'
    })
    assert response.status_code == 200
    data = response.json()
    assert data['domain'] == 'CYBER'


def test_classify_domain_economic():
    response = client.post('/api/v1/classify-domain', json={
        'text': 'Central bank raises interest rates as inflation hits 8% GDP contracts',
        'language': 'en'
    })
    assert response.status_code == 200
    data = response.json()
    assert data['domain'] == 'ECONOMIC'


def test_sentiment_negative():
    response = client.post('/api/v1/sentiment', json={
        'text': 'Deadly attack kills civilians, crisis worsens amid violence and destruction',
        'language': 'en'
    })
    assert response.status_code == 200
    data = response.json()
    assert data['label'] == 'NEGATIVE'
    assert data['score'] < 0


def test_sentiment_positive():
    response = client.post('/api/v1/sentiment', json={
        'text': 'Peace agreement reached, economic growth improves living standards',
        'language': 'en'
    })
    assert response.status_code == 200
    data = response.json()
    assert data['label'] == 'POSITIVE'


def test_extract_keywords():
    response = client.post('/api/v1/keywords', json={
        'text': 'The United Nations Security Council convened an emergency session on nuclear proliferation',
        'language': 'en',
        'top_n': 5
    })
    assert response.status_code == 200
    data = response.json()
    assert 'keywords' in data
    assert len(data['keywords']) > 0


def test_process_full_pipeline():
    response = client.post('/api/v1/process', json={
        'text': 'Russian military forces conducted exercises near the Ukrainian border amid diplomatic tensions',
        'source_id': 'test-source',
        'raw_content_id': 'test-content'
    })
    assert response.status_code == 200
    data = response.json()
    assert 'language' in data
    assert 'domain' in data
    assert 'sentiment' in data
    assert 'keywords' in data
    assert 'entities' in data
    assert 'summary' in data
