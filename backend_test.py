#!/usr/bin/env python3
"""
CyberFocus Backend API Testing Suite
Tests all API endpoints for the gamified productivity app
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class CyberFocusAPITester:
    def __init__(self, base_url="https://modern-stack-app-3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}

            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_health_endpoints(self):
        """Test basic health and data endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test health endpoint
        success, data = self.make_request('GET', 'health')
        self.log_test("Health Check", success, 
                     f"Status: {data.get('status', 'unknown')}" if success else f"Error: {data}")
        
        # Test data endpoint
        success, data = self.make_request('GET', 'data')
        self.log_test("Data Endpoint", success,
                     f"Message: {data.get('message', 'unknown')}" if success else f"Error: {data}")

    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n🔍 Testing Authentication...")
        
        # Generate unique test user
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!"
        }

        # Test user registration
        success, data = self.make_request('POST', 'auth/register', test_user, 200)
        if success and 'token' in data:
            self.token = data['token']
            self.user_id = data['user']['id']
            self.log_test("User Registration", True, f"User ID: {self.user_id}")
        else:
            self.log_test("User Registration", False, "Failed to register user", data)
            return False

        # Test get current user
        success, data = self.make_request('GET', 'auth/me')
        self.log_test("Get Current User", success,
                     f"Username: {data.get('username', 'unknown')}" if success else f"Error: {data}")

        # Test login with same credentials
        login_data = {"email": test_user["email"], "password": test_user["password"]}
        success, data = self.make_request('POST', 'auth/login', login_data, 200)
        if success and 'token' in data:
            self.token = data['token']  # Update token
            self.log_test("User Login", True, f"New token received")
        else:
            self.log_test("User Login", False, "Failed to login", data)

        return True

    def test_task_management(self):
        """Test task CRUD operations"""
        print("\n🔍 Testing Task Management...")
        
        if not self.token:
            self.log_test("Task Tests", False, "No authentication token available")
            return

        # Create a test task
        task_data = {
            "title": "Test Task for API Testing",
            "description": "This is a test task created by the API tester",
            "skill_tree": "Work",
            "difficulty": 3,
            "estimated_minutes": 45
        }

        success, data = self.make_request('POST', 'tasks', task_data, 200)
        task_id = None
        if success and 'id' in data:
            task_id = data['id']
            self.log_test("Create Task", True, f"Task ID: {task_id}, XP Reward: {data.get('xp_reward', 0)}")
        else:
            self.log_test("Create Task", False, "Failed to create task", data)
            return

        # Get all tasks
        success, data = self.make_request('GET', 'tasks')
        self.log_test("Get All Tasks", success,
                     f"Found {len(data)} tasks" if success and isinstance(data, list) else f"Error: {data}")

        # Get pending tasks
        success, data = self.make_request('GET', 'tasks?completed=false')
        self.log_test("Get Pending Tasks", success,
                     f"Found {len(data)} pending tasks" if success and isinstance(data, list) else f"Error: {data}")

        # Complete the task
        if task_id:
            success, data = self.make_request('PATCH', f'tasks/{task_id}', {"completed": True})
            if success:
                xp_earned = data.get('xp_reward', 0)
                level_up = data.get('level_up', False)
                self.log_test("Complete Task", True, 
                             f"XP earned: {xp_earned}, Level up: {level_up}")
            else:
                self.log_test("Complete Task", False, "Failed to complete task", data)

            # Delete the task
            success, data = self.make_request('DELETE', f'tasks/{task_id}', expected_status=200)
            self.log_test("Delete Task", success,
                         "Task deleted successfully" if success else f"Error: {data}")

    def test_boss_challenge(self):
        """Test boss challenge functionality"""
        print("\n🔍 Testing Boss Challenge...")
        
        if not self.token:
            self.log_test("Boss Challenge Tests", False, "No authentication token available")
            return

        # Get today's boss challenge
        success, data = self.make_request('GET', 'boss-challenge/today')
        challenge_id = None
        if success and 'id' in data:
            challenge_id = data['id']
            self.log_test("Get Boss Challenge", True, 
                         f"Challenge: {data.get('challenge_text', 'unknown')[:50]}...")
        else:
            self.log_test("Get Boss Challenge", False, "Failed to get boss challenge", data)
            return

        # Complete boss challenge
        if challenge_id:
            success, data = self.make_request('POST', f'boss-challenge/{challenge_id}/complete')
            if success:
                xp_earned = data.get('xp_earned', 0)
                level_up = data.get('level_up', False)
                self.log_test("Complete Boss Challenge", True,
                             f"XP earned: {xp_earned}, Level up: {level_up}")
            else:
                self.log_test("Complete Boss Challenge", False, "Failed to complete challenge", data)

    def test_ai_coach(self):
        """Test AI Coach functionality"""
        print("\n🔍 Testing AI Coach...")
        
        if not self.token:
            self.log_test("AI Coach Tests", False, "No authentication token available")
            return

        # Test chat with AI coach
        chat_data = {"message": "Hello CyberCoach! How can I be more productive today?"}
        success, data = self.make_request('POST', 'ai-coach/chat', chat_data)
        if success and 'response' in data:
            response_preview = data['response'][:100] + "..." if len(data['response']) > 100 else data['response']
            self.log_test("AI Coach Chat", True, f"Response: {response_preview}")
        else:
            self.log_test("AI Coach Chat", False, "Failed to get AI response", data)

        # Get chat history
        success, data = self.make_request('GET', 'ai-coach/history')
        self.log_test("AI Coach History", success,
                     f"Found {len(data)} messages" if success and isinstance(data, list) else f"Error: {data}")

    def test_focus_mode(self):
        """Test Focus Mode functionality"""
        print("\n🔍 Testing Focus Mode...")
        
        if not self.token:
            self.log_test("Focus Mode Tests", False, "No authentication token available")
            return

        # Start focus session
        session_data = {"duration_minutes": 25}
        success, data = self.make_request('POST', 'focus/start', session_data)
        session_id = None
        if success and 'id' in data:
            session_id = data['id']
            self.log_test("Start Focus Session", True, f"Session ID: {session_id}")
        else:
            self.log_test("Start Focus Session", False, "Failed to start session", data)
            return

        # Complete focus session
        if session_id:
            success, data = self.make_request('POST', f'focus/{session_id}/complete')
            if success:
                xp_earned = data.get('xp_earned', 0)
                level_up = data.get('level_up', False)
                self.log_test("Complete Focus Session", True,
                             f"XP earned: {xp_earned}, Level up: {level_up}")
            else:
                self.log_test("Complete Focus Session", False, "Failed to complete session", data)

        # Get focus history
        success, data = self.make_request('GET', 'focus/history')
        self.log_test("Focus History", success,
                     f"Found {len(data)} sessions" if success and isinstance(data, list) else f"Error: {data}")

    def test_analytics(self):
        """Test Analytics endpoints"""
        print("\n🔍 Testing Analytics...")
        
        if not self.token:
            self.log_test("Analytics Tests", False, "No authentication token available")
            return

        # Get dashboard analytics
        success, data = self.make_request('GET', 'analytics/dashboard')
        if success:
            stats = f"Tasks: {data.get('total_tasks', 0)}, Level: {data.get('level', 0)}, Streak: {data.get('streak', 0)}"
            self.log_test("Dashboard Analytics", True, stats)
        else:
            self.log_test("Dashboard Analytics", False, "Failed to get analytics", data)

        # Get weekly analytics
        success, data = self.make_request('GET', 'analytics/weekly')
        self.log_test("Weekly Analytics", success,
                     f"Found {len(data)} days of data" if success and isinstance(data, list) else f"Error: {data}")

    def test_achievements(self):
        """Test Achievements functionality"""
        print("\n🔍 Testing Achievements...")
        
        if not self.token:
            self.log_test("Achievements Tests", False, "No authentication token available")
            return

        # Get achievements
        success, data = self.make_request('GET', 'achievements')
        if success and isinstance(data, list):
            unlocked = sum(1 for ach in data if ach.get('unlocked', False))
            self.log_test("Get Achievements", True, f"Found {len(data)} achievements, {unlocked} unlocked")
        else:
            self.log_test("Get Achievements", False, "Failed to get achievements", data)

    def test_admin_functionality(self):
        """Test Admin Panel functionality"""
        print("\n🔍 Testing Admin Panel...")
        
        # Test admin login
        admin_credentials = {"username": "Rebadion", "password": "Rebadion2010"}
        success, data = self.make_request('POST', 'admin/login', admin_credentials)
        admin_token = None
        if success and 'token' in data:
            admin_token = data['token']
            self.log_test("Admin Login", True, f"Admin authenticated: {data.get('username', 'unknown')}")
        else:
            self.log_test("Admin Login", False, "Failed to login as admin", data)
            return

        # Temporarily store user token and use admin token
        user_token = self.token
        self.token = admin_token

        # Test admin stats
        success, data = self.make_request('GET', 'admin/stats')
        if success:
            stats = f"Users: {data.get('total_users', 0)}, Tasks: {data.get('total_tasks', 0)}"
            self.log_test("Admin Stats", True, stats)
        else:
            self.log_test("Admin Stats", False, "Failed to get admin stats", data)

        # Test get all users
        success, data = self.make_request('GET', 'admin/users')
        self.log_test("Admin Get Users", success,
                     f"Found {len(data)} users" if success and isinstance(data, list) else f"Error: {data}")

        # Test create quest
        quest_data = {
            "title": "Test Quest",
            "description": "A test quest created by API tester",
            "quest_type": "daily",
            "difficulty": 3,
            "xp_reward": 100,
            "questions": [
                {
                    "question": "What is productivity?",
                    "options": ["Getting things done", "Being busy", "Working hard", "Multitasking"],
                    "correct_answer": 0
                }
            ]
        }
        success, data = self.make_request('POST', 'admin/quests', quest_data)
        quest_id = None
        if success and 'id' in data:
            quest_id = data['id']
            self.log_test("Admin Create Quest", True, f"Quest ID: {quest_id}")
        else:
            self.log_test("Admin Create Quest", False, "Failed to create quest", data)

        # Test get admin quests
        success, data = self.make_request('GET', 'admin/quests')
        self.log_test("Admin Get Quests", success,
                     f"Found {len(data)} quests" if success and isinstance(data, list) else f"Error: {data}")

        # Test create news
        news_data = {
            "title": "Test News",
            "content": "This is a test news article created by the API tester",
            "category": "announcement"
        }
        success, data = self.make_request('POST', 'admin/news', news_data)
        news_id = None
        if success and 'id' in data:
            news_id = data['id']
            self.log_test("Admin Create News", True, f"News ID: {news_id}")
        else:
            self.log_test("Admin Create News", False, "Failed to create news", data)

        # Test create learning content
        learning_data = {
            "title": "Test Learning Content",
            "description": "A test learning module",
            "content": "This is the content of the learning module with detailed information.",
            "category": "productivity",
            "difficulty": "beginner",
            "estimated_minutes": 15
        }
        success, data = self.make_request('POST', 'admin/learning', learning_data)
        learning_id = None
        if success and 'id' in data:
            learning_id = data['id']
            self.log_test("Admin Create Learning", True, f"Learning ID: {learning_id}")
        else:
            self.log_test("Admin Create Learning", False, "Failed to create learning content", data)

        # Test create music track
        music_data = {
            "title": "Test Music Track",
            "artist": "Test Artist",
            "url": "https://www.youtube.com/watch?v=test123",
            "category": "lofi",
            "thumbnail": "https://example.com/thumbnail.jpg"
        }
        success, data = self.make_request('POST', 'admin/music', music_data)
        music_id = None
        if success and 'id' in data:
            music_id = data['id']
            self.log_test("Admin Create Music", True, f"Music ID: {music_id}")
        else:
            self.log_test("Admin Create Music", False, "Failed to create music track", data)

        # Clean up - delete created items
        if quest_id:
            success, _ = self.make_request('DELETE', f'admin/quests/{quest_id}')
            self.log_test("Admin Delete Quest", success, "Quest deleted" if success else "Failed to delete quest")

        if news_id:
            success, _ = self.make_request('DELETE', f'admin/news/{news_id}')
            self.log_test("Admin Delete News", success, "News deleted" if success else "Failed to delete news")

        if learning_id:
            success, _ = self.make_request('DELETE', f'admin/learning/{learning_id}')
            self.log_test("Admin Delete Learning", success, "Learning deleted" if success else "Failed to delete learning")

        if music_id:
            success, _ = self.make_request('DELETE', f'admin/music/{music_id}')
            self.log_test("Admin Delete Music", success, "Music deleted" if success else "Failed to delete music")

        # Restore user token
        self.token = user_token

    def test_public_endpoints(self):
        """Test public endpoints that don't require authentication"""
        print("\n🔍 Testing Public Endpoints...")
        
        # Temporarily remove token for public endpoints
        user_token = self.token
        self.token = None

        # Test public news
        success, data = self.make_request('GET', 'news')
        self.log_test("Public News", success,
                     f"Found {len(data)} news items" if success and isinstance(data, list) else f"Error: {data}")

        # Test public learning content
        success, data = self.make_request('GET', 'learning')
        self.log_test("Public Learning", success,
                     f"Found {len(data)} learning items" if success and isinstance(data, list) else f"Error: {data}")

        # Test public music tracks
        success, data = self.make_request('GET', 'music')
        self.log_test("Public Music", success,
                     f"Found {len(data)} music tracks" if success and isinstance(data, list) else f"Error: {data}")

        # Test music by category
        success, data = self.make_request('GET', 'music?category=lofi')
        self.log_test("Music by Category", success,
                     f"Found {len(data)} lofi tracks" if success and isinstance(data, list) else f"Error: {data}")

        # Restore user token
        self.token = user_token

    def test_user_features(self):
        """Test new user features like settings and quests"""
        print("\n🔍 Testing User Features...")
        
        if not self.token:
            self.log_test("User Features Tests", False, "No authentication token available")
            return

        # Test get user settings
        success, data = self.make_request('GET', 'settings')
        if success:
            self.log_test("Get User Settings", True, f"Music enabled: {data.get('music_enabled', False)}")
        else:
            self.log_test("Get User Settings", False, "Failed to get settings", data)

        # Test update user settings
        settings_data = {
            "music_enabled": True,
            "music_volume": 75,
            "preferred_music_category": "ambient",
            "notifications_enabled": True,
            "focus_duration": 30,
            "theme": "dark"
        }
        success, data = self.make_request('PUT', 'settings', settings_data)
        self.log_test("Update User Settings", success,
                     "Settings updated successfully" if success else f"Error: {data}")

        # Test get available quests
        success, data = self.make_request('GET', 'quests/available')
        self.log_test("Get Available Quests", success,
                     f"Found {len(data)} available quests" if success and isinstance(data, list) else f"Error: {data}")

        # Test AI task suggestion
        ai_request = {
            "context": "I want to learn Python programming",
            "skill_tree": "Learning"
        }
        success, data = self.make_request('POST', 'ai/suggest-task', ai_request)
        if success and 'title' in data:
            self.log_test("AI Task Suggestion", True, f"Suggested: {data.get('title', 'unknown')}")
        else:
            self.log_test("AI Task Suggestion", False, "Failed to get AI suggestion", data)

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting CyberFocus API Test Suite")
        print(f"🎯 Testing against: {self.base_url}")
        print("=" * 60)

        # Run all test categories
        self.test_health_endpoints()
        
        if self.test_auth_flow():
            self.test_task_management()
            self.test_boss_challenge()
            self.test_ai_coach()
            self.test_focus_mode()
            self.test_analytics()
            self.test_achievements()
        else:
            print("\n❌ Authentication failed - skipping authenticated tests")

        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Show failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = CyberFocusAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    try:
        with open('/app/test_reports/backend_api_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': tester.tests_run,
                    'passed': tester.tests_passed,
                    'failed': tester.tests_run - tester.tests_passed,
                    'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
                },
                'results': tester.test_results,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not save results to file: {e}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())