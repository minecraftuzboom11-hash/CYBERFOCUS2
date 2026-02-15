#!/usr/bin/env python3
"""
FastAPI Backend Migration Test Suite
Tests all endpoints mentioned in the review request against the external preview URL
"""

import requests
import json
import sys
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://quest-dashboard-4.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class FastAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.admin_token = None
        self.test_results = []
        self.test_user_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        self.test_user_username = f"testuser_{uuid.uuid4().hex[:8]}"
        self.test_task_id = None
        self.test_quest_id = None
        
    def log_result(self, test_name, success, message, response_data=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        
    def test_healthz_endpoints(self):
        """Test GET /api/healthz and /healthz"""
        results = []
        
        # Test /api/healthz
        try:
            response = self.session.get(f"{API_BASE}/healthz", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ok':
                    self.log_result("GET /api/healthz", True, "Returns 200 with {status: ok}", data)
                    results.append(True)
                else:
                    self.log_result("GET /api/healthz", False, f"Wrong response format: {data}", data)
                    results.append(False)
            else:
                self.log_result("GET /api/healthz", False, f"Status code {response.status_code}", response.text)
                results.append(False)
                
        except Exception as e:
            self.log_result("GET /api/healthz", False, f"Request failed: {str(e)}")
            results.append(False)
        
        # Test /healthz (root endpoint)
        try:
            response = self.session.get(f"{BASE_URL}/healthz", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ok':
                    self.log_result("GET /healthz", True, "Returns 200 with {status: ok}", data)
                    results.append(True)
                else:
                    self.log_result("GET /healthz", False, f"Wrong response format: {data}", data)
                    results.append(False)
            else:
                self.log_result("GET /healthz", False, f"Status code {response.status_code}", response.text)
                results.append(False)
                
        except Exception as e:
            self.log_result("GET /healthz", False, f"Request failed: {str(e)}")
            results.append(False)
        
        return all(results)
    
    def test_auth_signup(self):
        """Test POST /api/auth/signup"""
        try:
            signup_data = {
                "email": self.test_user_email,
                "username": self.test_user_username,
                "password": "testpassword123"
            }
            
            response = self.session.post(f"{API_BASE}/auth/signup", json=signup_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data and 'user' in data and data['token_type'] == 'bearer':
                    self.auth_token = data['access_token']
                    self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                    self.log_result("POST /api/auth/signup", True, "Signup successful, token received", {'user_id': data['user'].get('id')})
                    return True
                else:
                    self.log_result("POST /api/auth/signup", False, f"Missing required fields in response", data)
                    return False
            else:
                self.log_result("POST /api/auth/signup", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("POST /api/auth/signup", False, f"Request failed: {str(e)}")
            return False
    
    def test_auth_login(self):
        """Test POST /api/auth/login"""
        try:
            login_data = {
                "email": self.test_user_email,
                "password": "testpassword123"
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data and 'user' in data and data['token_type'] == 'bearer':
                    self.auth_token = data['access_token']
                    self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                    self.log_result("POST /api/auth/login", True, "Login successful, token received", {'user_id': data['user'].get('id')})
                    return True
                else:
                    self.log_result("POST /api/auth/login", False, f"Missing required fields in response", data)
                    return False
            else:
                self.log_result("POST /api/auth/login", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("POST /api/auth/login", False, f"Request failed: {str(e)}")
            return False
    
    def test_auth_me(self):
        """Test GET /api/auth/me"""
        if not self.auth_token:
            self.log_result("GET /api/auth/me", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/auth/me", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and 'username' in data and 'email' in data:
                    self.log_result("GET /api/auth/me", True, "User profile retrieved successfully", {'username': data.get('username')})
                    return True
                else:
                    self.log_result("GET /api/auth/me", False, f"Missing required user fields", data)
                    return False
            else:
                self.log_result("GET /api/auth/me", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/auth/me", False, f"Request failed: {str(e)}")
            return False
    
    def test_tasks_get(self):
        """Test GET /api/tasks"""
        if not self.auth_token:
            self.log_result("GET /api/tasks", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/tasks", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("GET /api/tasks", True, f"Returns task list with {len(data)} tasks", {'task_count': len(data)})
                    return True
                else:
                    self.log_result("GET /api/tasks", False, f"Expected list, got: {type(data)}", data)
                    return False
            else:
                self.log_result("GET /api/tasks", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/tasks", False, f"Request failed: {str(e)}")
            return False
    
    def test_tasks_post(self):
        """Test POST /api/tasks"""
        if not self.auth_token:
            self.log_result("POST /api/tasks", False, "No auth token available")
            return False
            
        try:
            task_data = {
                "title": "Test Task for FastAPI Migration",
                "description": "Testing task creation endpoint",
                "skill_tree": "Mind",
                "difficulty": 2,
                "estimated_minutes": 30
            }
            
            response = self.session.post(f"{API_BASE}/tasks", json=task_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'task' in data:
                    self.test_task_id = data['task'].get('id')
                    self.log_result("POST /api/tasks", True, "Task created successfully", {'task_id': self.test_task_id})
                    return True
                else:
                    self.log_result("POST /api/tasks", False, f"Unexpected response format", data)
                    return False
            else:
                self.log_result("POST /api/tasks", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("POST /api/tasks", False, f"Request failed: {str(e)}")
            return False
    
    def test_tasks_complete(self):
        """Test PATCH /api/tasks/{id}/complete"""
        if not self.auth_token or not self.test_task_id:
            self.log_result("PATCH /api/tasks/{id}/complete", False, "No auth token or task ID available")
            return False
            
        try:
            response = self.session.patch(f"{API_BASE}/tasks/{self.test_task_id}/complete", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'xp_gained' in data:
                    self.log_result("PATCH /api/tasks/{id}/complete", True, f"Task completed, gained {data.get('xp_gained')} XP", data)
                    return True
                else:
                    self.log_result("PATCH /api/tasks/{id}/complete", False, f"Unexpected response format", data)
                    return False
            else:
                self.log_result("PATCH /api/tasks/{id}/complete", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("PATCH /api/tasks/{id}/complete", False, f"Request failed: {str(e)}")
            return False
    
    def test_tasks_delete(self):
        """Test DELETE /api/tasks/{id}"""
        if not self.auth_token or not self.test_task_id:
            self.log_result("DELETE /api/tasks/{id}", False, "No auth token or task ID available")
            return False
            
        try:
            response = self.session.delete(f"{API_BASE}/tasks/{self.test_task_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("DELETE /api/tasks/{id}", True, "Task deleted successfully", data)
                    return True
                else:
                    self.log_result("DELETE /api/tasks/{id}", False, f"Unexpected response format", data)
                    return False
            else:
                self.log_result("DELETE /api/tasks/{id}", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("DELETE /api/tasks/{id}", False, f"Request failed: {str(e)}")
            return False
    
    def test_analytics_dashboard(self):
        """Test GET /api/analytics/dashboard"""
        if not self.auth_token:
            self.log_result("GET /api/analytics/dashboard", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/analytics/dashboard", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ['total_tasks', 'current_level', 'discipline_score', 'weekly_data']
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    self.log_result("GET /api/analytics/dashboard", True, f"Analytics data retrieved successfully", {'window_days': data.get('window_days')})
                    return True
                else:
                    self.log_result("GET /api/analytics/dashboard", False, f"Missing fields: {missing_fields}", data)
                    return False
            else:
                self.log_result("GET /api/analytics/dashboard", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/analytics/dashboard", False, f"Request failed: {str(e)}")
            return False
    
    def test_quests_daily(self):
        """Test GET /api/quests/daily"""
        if not self.auth_token:
            self.log_result("GET /api/quests/daily", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/quests/daily", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'quests' in data and isinstance(data['quests'], list):
                    quest_count = len(data['quests'])
                    if quest_count > 0:
                        self.test_quest_id = data['quests'][0].get('id')
                    self.log_result("GET /api/quests/daily", True, f"Returns {quest_count} daily quests", {'quest_count': quest_count})
                    return True
                else:
                    self.log_result("GET /api/quests/daily", False, f"Missing or invalid quests field", data)
                    return False
            else:
                self.log_result("GET /api/quests/daily", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/quests/daily", False, f"Request failed: {str(e)}")
            return False
    
    def test_quests_weekly(self):
        """Test GET /api/quests/weekly"""
        if not self.auth_token:
            self.log_result("GET /api/quests/weekly", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/quests/weekly", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'quests' in data and isinstance(data['quests'], list):
                    quest_count = len(data['quests'])
                    self.log_result("GET /api/quests/weekly", True, f"Returns {quest_count} weekly quests", {'quest_count': quest_count})
                    return True
                else:
                    self.log_result("GET /api/quests/weekly", False, f"Missing or invalid quests field", data)
                    return False
            else:
                self.log_result("GET /api/quests/weekly", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/quests/weekly", False, f"Request failed: {str(e)}")
            return False
    
    def test_quests_complete(self):
        """Test POST /api/quests/{id}/complete?quest_type=daily"""
        if not self.auth_token or not self.test_quest_id:
            self.log_result("POST /api/quests/{id}/complete", False, "No auth token or quest ID available")
            return False
            
        try:
            response = self.session.post(f"{API_BASE}/quests/{self.test_quest_id}/complete?quest_type=daily", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'xp_gained' in data:
                    self.log_result("POST /api/quests/{id}/complete", True, f"Quest completed, gained {data.get('xp_gained')} XP", data)
                    return True
                else:
                    self.log_result("POST /api/quests/{id}/complete", False, f"Unexpected response format", data)
                    return False
            else:
                self.log_result("POST /api/quests/{id}/complete", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("POST /api/quests/{id}/complete", False, f"Request failed: {str(e)}")
            return False
    
    def test_leaderboard_global(self):
        """Test GET /api/leaderboard/global?timeframe=all_time&limit=10"""
        if not self.auth_token:
            self.log_result("GET /api/leaderboard/global", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/leaderboard/global?timeframe=all_time&limit=10", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'leaderboard' in data and 'current_user_rank' in data:
                    leaderboard_count = len(data['leaderboard'])
                    self.log_result("GET /api/leaderboard/global", True, f"Returns leaderboard with {leaderboard_count} users", {'rank': data.get('current_user_rank')})
                    return True
                else:
                    self.log_result("GET /api/leaderboard/global", False, f"Missing required fields", data)
                    return False
            else:
                self.log_result("GET /api/leaderboard/global", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/leaderboard/global", False, f"Request failed: {str(e)}")
            return False
    
    def test_user_background_get(self):
        """Test GET /api/user/background"""
        if not self.auth_token:
            self.log_result("GET /api/user/background", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/user/background", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'background' in data and 'tokens' in data:
                    self.log_result("GET /api/user/background", True, f"Background: {data.get('background')}, Tokens: {data.get('tokens')}", data)
                    return True
                else:
                    self.log_result("GET /api/user/background", False, f"Missing required fields", data)
                    return False
            else:
                self.log_result("GET /api/user/background", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/user/background", False, f"Request failed: {str(e)}")
            return False
    
    def test_user_background_update(self):
        """Test POST /api/user/background/update"""
        if not self.auth_token:
            self.log_result("POST /api/user/background/update", False, "No auth token available")
            return False
            
        try:
            background_data = {
                "background": "gradient:test:blue-purple"
            }
            
            response = self.session.post(f"{API_BASE}/user/background/update", json=background_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'background' in data:
                    self.log_result("POST /api/user/background/update", True, f"Background updated to: {data.get('background')}", data)
                    return True
                else:
                    self.log_result("POST /api/user/background/update", False, f"Unexpected response format", data)
                    return False
            else:
                self.log_result("POST /api/user/background/update", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("POST /api/user/background/update", False, f"Request failed: {str(e)}")
            return False
    
    def test_system_access(self):
        """Test POST /api/system/access (admin login)"""
        try:
            admin_data = {
                "username": "Rebadion",
                "password": "Rebadion2010"
            }
            
            response = self.session.post(f"{API_BASE}/system/access", json=admin_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data and data['token_type'] == 'bearer':
                    self.admin_token = data['access_token']
                    self.log_result("POST /api/system/access", True, "Admin login successful", {'token_type': data.get('token_type')})
                    return True
                else:
                    self.log_result("POST /api/system/access", False, f"Missing required fields", data)
                    return False
            else:
                self.log_result("POST /api/system/access", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("POST /api/system/access", False, f"Request failed: {str(e)}")
            return False
    
    def test_admin_quests_stats(self):
        """Test GET /api/admin/quests/stats"""
        if not self.admin_token:
            self.log_result("GET /api/admin/quests/stats", False, "No admin token available")
            return False
            
        try:
            # Create a new session with admin token
            admin_session = requests.Session()
            admin_session.headers.update({'Authorization': f'Bearer {self.admin_token}'})
            
            response = admin_session.get(f"{API_BASE}/admin/quests/stats", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ['total_global_quests', 'active_quests', 'total_completions']
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    self.log_result("GET /api/admin/quests/stats", True, f"Admin stats retrieved successfully", data)
                    return True
                else:
                    self.log_result("GET /api/admin/quests/stats", False, f"Missing fields: {missing_fields}", data)
                    return False
            else:
                self.log_result("GET /api/admin/quests/stats", False, f"Status code {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/admin/quests/stats", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all FastAPI migration tests"""
        print(f"🚀 Starting FastAPI Backend Migration Tests")
        print(f"📍 Testing: {BASE_URL}")
        print("=" * 80)
        
        tests = [
            ("Health Checks", [
                self.test_healthz_endpoints,
            ]),
            ("Authentication", [
                self.test_auth_signup,
                self.test_auth_login,
                self.test_auth_me,
            ]),
            ("Tasks", [
                self.test_tasks_get,
                self.test_tasks_post,
                self.test_tasks_complete,
                self.test_tasks_delete,
            ]),
            ("Analytics", [
                self.test_analytics_dashboard,
            ]),
            ("Quests", [
                self.test_quests_daily,
                self.test_quests_weekly,
                self.test_quests_complete,
            ]),
            ("Leaderboard", [
                self.test_leaderboard_global,
            ]),
            ("Background", [
                self.test_user_background_get,
                self.test_user_background_update,
            ]),
            ("Admin", [
                self.test_system_access,
                self.test_admin_quests_stats,
            ]),
        ]
        
        total_passed = 0
        total_tests = 0
        
        for category, test_list in tests:
            print(f"\n📂 {category} Tests:")
            print("-" * 40)
            
            category_passed = 0
            for test in test_list:
                total_tests += 1
                if test():
                    total_passed += 1
                    category_passed += 1
            
            print(f"   {category}: {category_passed}/{len(test_list)} passed")
        
        print("=" * 80)
        print(f"📊 Overall Results: {total_passed}/{total_tests} tests passed")
        
        if total_passed == total_tests:
            print("🎉 ALL FASTAPI MIGRATION TESTS PASSED!")
            return True
        else:
            print(f"⚠️  {total_tests - total_passed} test(s) FAILED")
            return False
    
    def print_summary(self):
        """Print detailed test summary"""
        print("\n📋 Detailed Test Summary:")
        print("-" * 60)
        
        failed_tests = [r for r in self.test_results if not r['success']]
        passed_tests = [r for r in self.test_results if r['success']]
        
        if failed_tests:
            print("❌ FAILED TESTS:")
            for result in failed_tests:
                print(f"   • {result['test']}: {result['message']}")
                if result['response_data']:
                    print(f"     Response: {result['response_data']}")
            print()
        
        print(f"✅ PASSED TESTS: {len(passed_tests)}")
        for result in passed_tests:
            print(f"   • {result['test']}")
        
        print(f"\n📈 Success Rate: {len(passed_tests)}/{len(self.test_results)} ({len(passed_tests)/len(self.test_results)*100:.1f}%)")

def main():
    tester = FastAPITester()
    success = tester.run_all_tests()
    tester.print_summary()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()