#!/usr/bin/env python3
"""
Focused Next.js Backend Testing - Debugging specific issues
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:3010"

def test_login_issue():
    """Debug the login credential issue"""
    print("🔍 Debugging Login Issue")
    
    # First create a user
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    signup_data = {
        "email": f"debuguser_{timestamp}@example.com",
        "username": f"debuguser_{timestamp}",
        "password": "DebugPassword123!"
    }
    
    session = requests.Session()
    
    print(f"1. Creating user: {signup_data['email']}")
    signup_response = session.post(
        f"{BASE_URL}/api/auth/signup",
        json=signup_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Signup Status: {signup_response.status_code}")
    if signup_response.status_code == 200:
        signup_data_resp = signup_response.json()
        print(f"   Signup Success: {signup_data_resp.get('success')}")
        print(f"   User ID: {signup_data_resp.get('user', {}).get('id')}")
        print(f"   Cookies: {list(signup_response.cookies.keys())}")
    else:
        print(f"   Signup Error: {signup_response.text}")
        return
    
    # Now try to login with same credentials
    print(f"\n2. Attempting login with same credentials")
    login_data = {
        "email": signup_data["email"],
        "password": signup_data["password"]
    }
    
    login_response = session.post(
        f"{BASE_URL}/api/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Login Status: {login_response.status_code}")
    print(f"   Login Response: {login_response.text}")
    
    if login_response.status_code != 200:
        print("   ❌ Login failed - this is the issue!")
    else:
        print("   ✅ Login successful")

def test_task_operations():
    """Debug task completion and deletion issues"""
    print("\n🔍 Debugging Task Operations")
    
    # Use existing session with auth
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    signup_data = {
        "email": f"taskuser_{timestamp}@example.com",
        "username": f"taskuser_{timestamp}",
        "password": "TaskPassword123!"
    }
    
    session = requests.Session()
    
    # Signup first
    signup_response = session.post(
        f"{BASE_URL}/api/auth/signup",
        json=signup_data,
        headers={"Content-Type": "application/json"}
    )
    
    if signup_response.status_code != 200:
        print("   ❌ Signup failed, can't test tasks")
        return
        
    cookies = {'qd4_token': signup_response.cookies['qd4_token']}
    
    # Create a task
    task_data = {
        "title": "Debug Task",
        "description": "Testing task operations",
        "skill_tree": "Mind",
        "difficulty": 1,
        "estimated_minutes": 15
    }
    
    print("1. Creating task")
    create_response = session.post(
        f"{BASE_URL}/api/tasks",
        json=task_data,
        cookies=cookies,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Create Status: {create_response.status_code}")
    if create_response.status_code == 200:
        create_data = create_response.json()
        task_id = create_data.get('task', {}).get('id')
        print(f"   Task ID: {task_id}")
        
        if task_id:
            # Try to complete the task
            print(f"\n2. Completing task {task_id}")
            complete_response = session.patch(
                f"{BASE_URL}/api/tasks/{task_id}/complete",
                cookies=cookies
            )
            
            print(f"   Complete Status: {complete_response.status_code}")
            print(f"   Complete Response: {complete_response.text}")
            
            # Try to delete the task
            print(f"\n3. Deleting task {task_id}")
            delete_response = session.delete(
                f"{BASE_URL}/api/tasks/{task_id}",
                cookies=cookies
            )
            
            print(f"   Delete Status: {delete_response.status_code}")
            print(f"   Delete Response: {delete_response.text}")
    else:
        print(f"   Create Error: {create_response.text}")

def test_quest_completion():
    """Debug quest completion issue"""
    print("\n🔍 Debugging Quest Completion")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    signup_data = {
        "email": f"questuser_{timestamp}@example.com",
        "username": f"questuser_{timestamp}",
        "password": "QuestPassword123!"
    }
    
    session = requests.Session()
    
    # Signup first
    signup_response = session.post(
        f"{BASE_URL}/api/auth/signup",
        json=signup_data,
        headers={"Content-Type": "application/json"}
    )
    
    if signup_response.status_code != 200:
        print("   ❌ Signup failed, can't test quests")
        return
        
    cookies = {'qd4_token': signup_response.cookies['qd4_token']}
    
    # Get daily quests
    print("1. Getting daily quests")
    quests_response = session.get(f"{BASE_URL}/api/quests/daily", cookies=cookies)
    
    print(f"   Quests Status: {quests_response.status_code}")
    if quests_response.status_code == 200:
        quests_data = quests_response.json()
        quests = quests_data.get('quests', [])
        print(f"   Found {len(quests)} quests")
        
        if quests:
            quest_id = quests[0].get('id')
            print(f"   First Quest ID: {quest_id}")
            
            # Try different completion endpoints
            print(f"\n2. Testing quest completion endpoints for {quest_id}")
            
            # Try the endpoint that returned 404
            print("   Trying: /api/quests/{quest_id}/complete?quest_type=daily")
            complete1_response = session.post(
                f"{BASE_URL}/api/quests/{quest_id}/complete?quest_type=daily",
                cookies=cookies
            )
            print(f"   Status: {complete1_response.status_code}")
            print(f"   Response: {complete1_response.text[:200]}...")
            
            # Try the quest-actions endpoint
            print("   Trying: /api/quest-actions/{quest_id}/complete?quest_type=daily")
            complete2_response = session.post(
                f"{BASE_URL}/api/quest-actions/{quest_id}/complete?quest_type=daily",
                cookies=cookies
            )
            print(f"   Status: {complete2_response.status_code}")
            print(f"   Response: {complete2_response.text}")
    else:
        print(f"   Quests Error: {quests_response.text}")

def test_background_endpoint():
    """Debug background endpoint issue"""
    print("\n🔍 Debugging Background Endpoint")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    signup_data = {
        "email": f"bguser_{timestamp}@example.com",
        "username": f"bguser_{timestamp}",
        "password": "BgPassword123!"
    }
    
    session = requests.Session()
    
    # Signup first
    signup_response = session.post(
        f"{BASE_URL}/api/auth/signup",
        json=signup_data,
        headers={"Content-Type": "application/json"}
    )
    
    if signup_response.status_code != 200:
        print("   ❌ Signup failed, can't test background")
        return
        
    cookies = {'qd4_token': signup_response.cookies['qd4_token']}
    
    # Test background GET
    print("1. Testing background GET")
    bg_response = session.get(f"{BASE_URL}/api/user/background", cookies=cookies)
    
    print(f"   Background Status: {bg_response.status_code}")
    print(f"   Background Response: {bg_response.text}")

if __name__ == "__main__":
    print("🚀 Next.js Backend Debugging Suite")
    print("=" * 50)
    
    test_login_issue()
    test_task_operations()
    test_quest_completion()
    test_background_endpoint()
    
    print("\n" + "=" * 50)
    print("🏁 Debugging Complete")