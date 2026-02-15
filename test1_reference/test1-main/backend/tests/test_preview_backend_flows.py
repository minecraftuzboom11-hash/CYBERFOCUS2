#!/usr/bin/env python3
"""
Backend API Testing Suite for Quest Dashboard
Tests all endpoints mentioned in the review request using the external preview URL.
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get the backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("ERROR: Could not get REACT_APP_BACKEND_URL from /app/frontend/.env")
    sys.exit(1)

print(f"Testing backend at: {BASE_URL}")

# Global variables for test data
auth_token = None
test_user_email = "testuser@example.com"
test_user_password = "testpassword123"
test_username = "testuser"

def make_request(method, endpoint, data=None, headers=None, expect_status=200):
    """Make HTTP request and return response"""
    url = f"{BASE_URL}{endpoint}"
    
    if headers is None:
        headers = {'Content-Type': 'application/json'}
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, timeout=10)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data, headers=headers, timeout=10)
        elif method.upper() == 'PATCH':
            response = requests.patch(url, json=data, headers=headers, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        print(f"{method} {endpoint} -> {response.status_code}")
        
        if response.status_code != expect_status:
            print(f"  UNEXPECTED STATUS: Expected {expect_status}, got {response.status_code}")
            print(f"  Response: {response.text[:500]}")
            return None
        
        try:
            return response.json()
        except:
            return response.text
            
    except requests.exceptions.RequestException as e:
        print(f"  ERROR: {e}")
        return None

def test_health_check():
    """Test 1: Health check endpoint"""
    print("\n=== TEST 1: Health Check ===")
    
    # Test /healthz (note: this may not be routed through ingress)
    result = make_request('GET', '/healthz')
    if result and isinstance(result, dict) and result.get('status') == 'ok':
        print("  ✅ /healthz endpoint working")
        return True
    else:
        print("  ⚠️  /healthz not routed through ingress (expected)")
        
        # Test alternative: public stats endpoint which should work
        stats_result = make_request('GET', '/api/public/stats')
        if stats_result and isinstance(stats_result, dict) and 'total_users' in stats_result:
            print("  ✅ Backend API is accessible via /api/public/stats")
            return True
        else:
            print("  ❌ Backend API not accessible")
            print(f"  Response: {stats_result}")
            return False

def test_auth_flow():
    """Test 2: Authentication flow"""
    print("\n=== TEST 2: Authentication Flow ===")
    global auth_token
    
    # Test signup
    signup_data = {
        "email": test_user_email,
        "username": test_username,
        "password": test_user_password
    }
    
    signup_result = make_request('POST', '/api/auth/signup', signup_data, expect_status=200)
    if not signup_result:
        # User might already exist, try login directly
        print("  Signup failed (user might exist), trying login...")
    else:
        print("  ✅ Signup successful")
        if 'access_token' in signup_result:
            auth_token = signup_result['access_token']
            print("  ✅ Token received from signup")
            return True
    
    # Test login
    login_data = {
        "email": test_user_email,
        "password": test_user_password
    }
    
    login_result = make_request('POST', '/api/auth/login', login_data, expect_status=200)
    if login_result and 'access_token' in login_result:
        auth_token = login_result['access_token']
        print("  ✅ Login successful")
        print("  ✅ Token received from login")
        return True
    else:
        print("  ❌ Login failed")
        print(f"  Response: {login_result}")
        return False

def test_authenticated_me():
    """Test 3: Authenticated /me endpoint"""
    print("\n=== TEST 3: Authenticated /me Endpoint ===")
    
    if not auth_token:
        print("  ❌ No auth token available")
        return False
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {auth_token}'
    }
    
    me_result = make_request('GET', '/api/auth/me', headers=headers)
    if me_result and isinstance(me_result, dict) and 'id' in me_result:
        print("  ✅ /api/auth/me working")
        print(f"  User ID: {me_result.get('id')}")
        print(f"  Username: {me_result.get('username')}")
        return True
    else:
        print("  ❌ /api/auth/me failed")
        print(f"  Response: {me_result}")
        return False

def test_mode_endpoints():
    """Test 4: Mode endpoints (authenticated)"""
    print("\n=== TEST 4: Mode Endpoints ===")
    
    if not auth_token:
        print("  ❌ No auth token available")
        return False
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {auth_token}'
    }
    
    results = {}
    
    # Test strategist endpoints
    print("  Testing Strategist endpoints...")
    vision_get = make_request('GET', '/api/strategist/vision', headers=headers)
    if vision_get:
        print("    ✅ GET /api/strategist/vision")
        results['strategist_vision_get'] = True
    else:
        print("    ❌ GET /api/strategist/vision")
        results['strategist_vision_get'] = False
    
    # Test saving a sample vision
    vision_data = {
        "vision": "Become a successful entrepreneur and build innovative tech solutions",
        "yearly_goals": ["Launch a startup", "Learn advanced programming", "Build a strong network"]
    }
    vision_post = make_request('POST', '/api/strategist/vision', vision_data, headers=headers)
    if vision_post:
        print("    ✅ POST /api/strategist/vision")
        results['strategist_vision_post'] = True
    else:
        print("    ❌ POST /api/strategist/vision")
        results['strategist_vision_post'] = False
    
    # Test daily priority
    daily_priority = make_request('GET', '/api/strategist/daily-priority', headers=headers)
    if daily_priority:
        print("    ✅ GET /api/strategist/daily-priority")
        results['strategist_daily_priority'] = True
    else:
        print("    ❌ GET /api/strategist/daily-priority")
        results['strategist_daily_priority'] = False
    
    # Test identity endpoints
    print("  Testing Identity endpoints...")
    alter_ego_get = make_request('GET', '/api/identity/alter-ego', headers=headers)
    if alter_ego_get:
        print("    ✅ GET /api/identity/alter-ego")
        results['identity_alter_ego_get'] = True
    else:
        print("    ❌ GET /api/identity/alter-ego")
        results['identity_alter_ego_get'] = False
    
    # Test saving alter ego
    alter_ego_data = {
        "name": "The Focused Achiever",
        "traits": ["disciplined", "strategic", "persistent"],
        "values": ["excellence", "growth", "impact"],
        "daily_habits": ["morning meditation", "goal review", "learning time"],
        "decision_framework": "Always ask: Does this move me closer to my goals?"
    }
    alter_ego_post = make_request('POST', '/api/identity/alter-ego', alter_ego_data, headers=headers)
    if alter_ego_post:
        print("    ✅ POST /api/identity/alter-ego")
        results['identity_alter_ego_post'] = True
    else:
        print("    ❌ POST /api/identity/alter-ego")
        results['identity_alter_ego_post'] = False
    
    # Test impact endpoints
    print("  Testing Impact endpoints...")
    impact_stats = make_request('GET', '/api/impact/stats', headers=headers)
    if impact_stats:
        print("    ✅ GET /api/impact/stats")
        results['impact_stats_get'] = True
    else:
        print("    ❌ GET /api/impact/stats")
        results['impact_stats_get'] = False
    
    # Test logging contribution
    contribution_data = {
        "type": "volunteer",
        "description": "Helped at local food bank for 2 hours",
        "hours": 2,
        "carbon_impact": 0
    }
    contribution_post = make_request('POST', '/api/impact/contribution', contribution_data, headers=headers)
    if contribution_post:
        print("    ✅ POST /api/impact/contribution")
        results['impact_contribution_post'] = True
    else:
        print("    ❌ POST /api/impact/contribution")
        results['impact_contribution_post'] = False
    
    # Test founder endpoints
    print("  Testing Founder endpoints...")
    founder_ideas_get = make_request('GET', '/api/founder/ideas', headers=headers)
    if founder_ideas_get:
        print("    ✅ GET /api/founder/ideas")
        results['founder_ideas_get'] = True
    else:
        print("    ❌ GET /api/founder/ideas")
        results['founder_ideas_get'] = False
    
    # Test adding startup idea
    idea_data = {
        "title": "AI-Powered Study Assistant",
        "description": "An AI tool that helps students create personalized study plans",
        "target_market": "College students and professionals",
        "revenue_model": "Subscription-based SaaS"
    }
    founder_ideas_post = make_request('POST', '/api/founder/ideas', idea_data, headers=headers)
    if founder_ideas_post:
        print("    ✅ POST /api/founder/ideas")
        results['founder_ideas_post'] = True
    else:
        print("    ❌ POST /api/founder/ideas")
        results['founder_ideas_post'] = False
    
    # Test psychology endpoints
    print("  Testing Psychology endpoints...")
    # Test logging mood first
    mood_data = {
        "mood": 8,
        "energy": 7,
        "notes": "Feeling productive and focused today"
    }
    mood_post = make_request('POST', '/api/psychology/mood', mood_data, headers=headers)
    if mood_post:
        print("    ✅ POST /api/psychology/mood")
        results['psychology_mood_post'] = True
    else:
        print("    ❌ POST /api/psychology/mood")
        results['psychology_mood_post'] = False
    
    # Test getting insights
    psychology_insights = make_request('GET', '/api/psychology/insights', headers=headers)
    if psychology_insights:
        print("    ✅ GET /api/psychology/insights")
        results['psychology_insights_get'] = True
    else:
        print("    ❌ GET /api/psychology/insights")
        results['psychology_insights_get'] = False
    
    return results

def test_quest_endpoints():
    """Test 5: Quest endpoints"""
    print("\n=== TEST 5: Quest Endpoints ===")
    
    if not auth_token:
        print("  ❌ No auth token available")
        return False
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {auth_token}'
    }
    
    results = {}
    
    # Test daily quests
    daily_quests = make_request('GET', '/api/quests/daily', headers=headers)
    if daily_quests:
        print("    ✅ GET /api/quests/daily")
        results['quests_daily'] = True
    else:
        print("    ❌ GET /api/quests/daily")
        results['quests_daily'] = False
    
    # Test weekly quests
    weekly_quests = make_request('GET', '/api/quests/weekly', headers=headers)
    if weekly_quests:
        print("    ✅ GET /api/quests/weekly")
        results['quests_weekly'] = True
    else:
        print("    ❌ GET /api/quests/weekly")
        results['quests_weekly'] = False
    
    return results

def run_all_tests():
    """Run all tests and provide summary"""
    print("🚀 Starting Backend API Tests")
    print(f"Target URL: {BASE_URL}")
    print("=" * 60)
    
    test_results = {}
    
    # Run tests
    test_results['health'] = test_health_check()
    test_results['auth'] = test_auth_flow()
    test_results['me'] = test_authenticated_me()
    test_results['modes'] = test_mode_endpoints()
    test_results['quests'] = test_quest_endpoints()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    total_tests = 0
    passed_tests = 0
    
    # Health check
    total_tests += 1
    if test_results['health']:
        passed_tests += 1
        print("✅ Health Check: PASSED")
    else:
        print("❌ Health Check: FAILED")
    
    # Auth flow
    total_tests += 1
    if test_results['auth']:
        passed_tests += 1
        print("✅ Authentication Flow: PASSED")
    else:
        print("❌ Authentication Flow: FAILED")
    
    # Me endpoint
    total_tests += 1
    if test_results['me']:
        passed_tests += 1
        print("✅ Authenticated /me: PASSED")
    else:
        print("❌ Authenticated /me: FAILED")
    
    # Mode endpoints
    if isinstance(test_results['modes'], dict):
        for endpoint, result in test_results['modes'].items():
            total_tests += 1
            if result:
                passed_tests += 1
                print(f"✅ {endpoint}: PASSED")
            else:
                print(f"❌ {endpoint}: FAILED")
    else:
        total_tests += 1
        print("❌ Mode Endpoints: FAILED (no auth token)")
    
    # Quest endpoints
    if isinstance(test_results['quests'], dict):
        for endpoint, result in test_results['quests'].items():
            total_tests += 1
            if result:
                passed_tests += 1
                print(f"✅ {endpoint}: PASSED")
            else:
                print(f"❌ {endpoint}: FAILED")
    else:
        total_tests += 1
        print("❌ Quest Endpoints: FAILED (no auth token)")
    
    print("\n" + "=" * 60)
    print(f"📈 FINAL SCORE: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED!")
        return True
    else:
        print("⚠️  Some tests failed. Check the details above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)