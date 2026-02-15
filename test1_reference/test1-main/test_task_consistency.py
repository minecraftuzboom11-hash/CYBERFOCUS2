#!/usr/bin/env python3
"""
Task Database Consistency Test
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:3010"

def test_task_database_consistency():
    """Test if tasks are properly stored and retrievable"""
    print("🔍 Testing Task Database Consistency")
    
    # Create user and get token
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    signup_data = {
        "email": f"dbtest_{timestamp}@example.com",
        "username": f"dbtest_{timestamp}",
        "password": "DbTest123!"
    }
    
    session = requests.Session()
    
    signup_response = session.post(
        f"{BASE_URL}/api/auth/signup",
        json=signup_data,
        headers={"Content-Type": "application/json"}
    )
    
    if signup_response.status_code != 200:
        print("❌ Could not create test user")
        return
        
    cookies = {'qd4_token': signup_response.cookies['qd4_token']}
    
    # Create a task
    task_data = {
        "title": "DB Consistency Test Task",
        "description": "Testing database consistency",
        "skill_tree": "Mind",
        "difficulty": 1,
        "estimated_minutes": 15
    }
    
    print("1. Creating task...")
    create_response = session.post(
        f"{BASE_URL}/api/tasks",
        json=task_data,
        cookies=cookies,
        headers={"Content-Type": "application/json"}
    )
    
    if create_response.status_code != 200:
        print(f"❌ Task creation failed: {create_response.text}")
        return
        
    create_data = create_response.json()
    task_id = create_data.get('task', {}).get('id')
    print(f"   ✅ Task created with ID: {task_id}")
    
    # Immediately try to retrieve all tasks
    print("2. Immediately retrieving all tasks...")
    get_response = session.get(f"{BASE_URL}/api/tasks", cookies=cookies)
    
    if get_response.status_code == 200:
        get_data = get_response.json()
        tasks = get_data.get('tasks', [])
        print(f"   Found {len(tasks)} tasks")
        
        # Check if our task is in the list
        our_task = None
        for task in tasks:
            if task.get('id') == task_id:
                our_task = task
                break
                
        if our_task:
            print(f"   ✅ Our task found in list: {our_task.get('title')}")
        else:
            print(f"   ❌ Our task NOT found in list")
            print(f"   Available task IDs: {[t.get('id') for t in tasks]}")
    else:
        print(f"   ❌ Could not retrieve tasks: {get_response.text}")
        
    # Wait and try again
    print("3. Waiting 2 seconds and trying again...")
    time.sleep(2)
    
    get_response2 = session.get(f"{BASE_URL}/api/tasks", cookies=cookies)
    if get_response2.status_code == 200:
        get_data2 = get_response2.json()
        tasks2 = get_data2.get('tasks', [])
        print(f"   Found {len(tasks2)} tasks after wait")
        
        our_task2 = None
        for task in tasks2:
            if task.get('id') == task_id:
                our_task2 = task
                break
                
        if our_task2:
            print(f"   ✅ Our task found after wait: {our_task2.get('title')}")
            
            # Now try to complete it
            print("4. Attempting to complete task...")
            complete_response = session.patch(
                f"{BASE_URL}/api/tasks/{task_id}/complete",
                cookies=cookies
            )
            
            print(f"   Complete Status: {complete_response.status_code}")
            print(f"   Complete Response: {complete_response.text}")
            
            if complete_response.status_code == 200:
                print("   ✅ Task completion successful!")
                
                # Try to delete it
                print("5. Attempting to delete task...")
                delete_response = session.delete(
                    f"{BASE_URL}/api/tasks/{task_id}",
                    cookies=cookies
                )
                
                print(f"   Delete Status: {delete_response.status_code}")
                print(f"   Delete Response: {delete_response.text}")
            else:
                print("   ❌ Task completion failed")
        else:
            print(f"   ❌ Our task STILL not found after wait")

if __name__ == "__main__":
    test_task_database_consistency()