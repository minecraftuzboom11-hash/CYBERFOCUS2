#!/usr/bin/env python3
"""
Backend Testing Suite for Next.js Quest Dashboard App
Testing endpoints running on localhost:3010 (vercel_next)

Test Requirements:
1) GET /api/healthz
2) Signup -> ensure Set-Cookie qd4_token is set and response {success:true}
3) /api/auth/me returns user when cookie sent
4) Login with correct creds sets cookie; wrong password returns 401
5) Tasks CRUD
6) Quests daily generation returns 3 quests; complete quest returns success
7) Leaderboard returns array
8) Background endpoints work
9) Admin login sets admin cookie; admin global quests GET works
"""

import requests
import json
import sys
from datetime import datetime

# Base URL for the Next.js app
BASE_URL = "http://localhost:3010"

class NextJSBackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.user_token = None
        self.admin_token = None
        self.test_results = []
        self.user_id = None
        
    def log_test(self, test_name, success, details="", response_body=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_body and not success:
            print(f"   Response: {response_body}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_body if not success else None
        })
        
    def test_health_check(self):
        """Test 1: GET /api/healthz"""
        try:
            response = self.session.get(f"{self.base_url}/api/healthz")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "ok":
                    self.log_test("Health Check", True, f"Status: {response.status_code}, Response: {data}")
                else:
                    self.log_test("Health Check", False, f"Unexpected response format", data)
            else:
                self.log_test("Health Check", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
    
    def test_signup(self):
        """Test 2: Signup -> ensure Set-Cookie qd4_token is set and response {success:true}"""
        try:
            # Generate unique test user
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            signup_data = {
                "email": f"testuser_{timestamp}@example.com",
                "username": f"testuser_{timestamp}",
                "password": "TestPassword123!"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/signup",
                json=signup_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response format
                if data.get("success") == True:
                    # Check for qd4_token cookie
                    cookies = response.cookies
                    if 'qd4_token' in cookies:
                        self.user_token = cookies['qd4_token']
                        # Store user info for later tests
                        if 'user' in data:
                            self.user_id = data['user'].get('id')
                        self.log_test("Signup Flow", True, 
                                    f"User created successfully, qd4_token cookie set, User ID: {self.user_id}")
                    else:
                        self.log_test("Signup Flow", False, "qd4_token cookie not set", data)
                else:
                    self.log_test("Signup Flow", False, "success field not true", data)
            else:
                self.log_test("Signup Flow", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Signup Flow", False, f"Exception: {str(e)}")
    
    def test_auth_me(self):
        """Test 3: /api/auth/me returns user when cookie sent"""
        try:
            # Test with cookie from signup
            if not self.user_token:
                self.log_test("Auth Me Endpoint", False, "No user token available from signup")
                return
                
            # Set cookie manually for this request
            cookies = {'qd4_token': self.user_token}
            response = self.session.get(f"{self.base_url}/api/auth/me", cookies=cookies)
            
            if response.status_code == 200:
                data = response.json()
                if 'user' in data and data['user'] is not None:
                    user = data['user']
                    if user.get('id') == self.user_id:
                        self.log_test("Auth Me Endpoint", True, 
                                    f"User returned correctly: {user.get('username', 'N/A')}")
                    else:
                        self.log_test("Auth Me Endpoint", False, "User ID mismatch", data)
                else:
                    self.log_test("Auth Me Endpoint", False, "No user in response", data)
            else:
                self.log_test("Auth Me Endpoint", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Auth Me Endpoint", False, f"Exception: {str(e)}")
    
    def test_login_flows(self):
        """Test 4: Login with correct creds sets cookie; wrong password returns 401"""
        try:
            # First, test with wrong password
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            wrong_login_data = {
                "email": f"testuser_{timestamp}@example.com",  # Use same email from signup
                "password": "WrongPassword123!"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=wrong_login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                self.log_test("Login Wrong Password", True, "Correctly returned 401 for wrong password")
            else:
                self.log_test("Login Wrong Password", False, 
                            f"Expected 401, got {response.status_code}", response.text)
            
            # Now test with correct credentials
            correct_login_data = {
                "email": f"testuser_{timestamp}@example.com",
                "password": "TestPassword123!"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=correct_login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") == True and 'qd4_token' in response.cookies:
                    self.log_test("Login Correct Credentials", True, 
                                "Login successful with qd4_token cookie set")
                else:
                    self.log_test("Login Correct Credentials", False, 
                                "Success field not true or cookie not set", data)
            else:
                self.log_test("Login Correct Credentials", False, 
                            f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Login Flows", False, f"Exception: {str(e)}")
    
    def test_tasks_crud(self):
        """Test 5: Tasks CRUD operations"""
        try:
            if not self.user_token:
                self.log_test("Tasks CRUD", False, "No user token available")
                return
                
            cookies = {'qd4_token': self.user_token}
            
            # Test GET tasks (should be empty initially)
            response = self.session.get(f"{self.base_url}/api/tasks", cookies=cookies)
            if response.status_code == 200:
                data = response.json()
                if 'tasks' in data:
                    self.log_test("Tasks GET", True, f"Retrieved {len(data['tasks'])} tasks")
                else:
                    self.log_test("Tasks GET", False, "No tasks field in response", data)
            else:
                self.log_test("Tasks GET", False, f"Status: {response.status_code}", response.text)
                return
            
            # Test POST create task
            task_data = {
                "title": "Test Task for CRUD",
                "description": "Testing task creation",
                "skill_tree": "Mind",
                "difficulty": 2,
                "estimated_minutes": 30
            }
            
            response = self.session.post(
                f"{self.base_url}/api/tasks",
                json=task_data,
                cookies=cookies,
                headers={"Content-Type": "application/json"}
            )
            
            task_id = None
            if response.status_code == 200:
                data = response.json()
                if data.get("success") == True and 'task' in data:
                    task_id = data['task'].get('id')
                    self.log_test("Tasks CREATE", True, f"Task created with ID: {task_id}")
                else:
                    self.log_test("Tasks CREATE", False, "Task creation failed", data)
            else:
                self.log_test("Tasks CREATE", False, f"Status: {response.status_code}", response.text)
                
            # Test task completion (if we have a task ID)
            if task_id:
                response = self.session.patch(
                    f"{self.base_url}/api/tasks/{task_id}/complete",
                    cookies=cookies
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") == True:
                        self.log_test("Tasks COMPLETE", True, f"Task completed successfully")
                    else:
                        self.log_test("Tasks COMPLETE", False, "Task completion failed", data)
                else:
                    self.log_test("Tasks COMPLETE", False, f"Status: {response.status_code}", response.text)
                
                # Test task deletion
                response = self.session.delete(f"{self.base_url}/api/tasks/{task_id}", cookies=cookies)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") == True:
                        self.log_test("Tasks DELETE", True, "Task deleted successfully")
                    else:
                        self.log_test("Tasks DELETE", False, "Task deletion failed", data)
                else:
                    self.log_test("Tasks DELETE", False, f"Status: {response.status_code}", response.text)
                    
        except Exception as e:
            self.log_test("Tasks CRUD", False, f"Exception: {str(e)}")
    
    def test_quests_daily(self):
        """Test 6: Quests daily generation returns 3 quests; complete quest returns success"""
        try:
            if not self.user_token:
                self.log_test("Quests Daily", False, "No user token available")
                return
                
            cookies = {'qd4_token': self.user_token}
            
            # Test GET daily quests
            response = self.session.get(f"{self.base_url}/api/quests/daily", cookies=cookies)
            
            if response.status_code == 200:
                data = response.json()
                if 'quests' in data:
                    quests = data['quests']
                    if len(quests) == 3:  # Expected 3 quests based on QUEST_TEMPLATES
                        self.log_test("Quests Daily Generation", True, 
                                    f"Generated {len(quests)} daily quests as expected")
                        
                        # Test completing a quest
                        if quests:
                            quest_id = quests[0].get('id')
                            if quest_id:
                                complete_response = self.session.post(
                                    f"{self.base_url}/api/quests/{quest_id}/complete?quest_type=daily",
                                    cookies=cookies
                                )
                                
                                if complete_response.status_code == 200:
                                    complete_data = complete_response.json()
                                    if complete_data.get("success") == True:
                                        self.log_test("Quest Complete", True, 
                                                    f"Quest completed successfully, XP gained: {complete_data.get('xp_gained', 0)}")
                                    else:
                                        self.log_test("Quest Complete", False, 
                                                    "Quest completion failed", complete_data)
                                else:
                                    self.log_test("Quest Complete", False, 
                                                f"Status: {complete_response.status_code}", complete_response.text)
                    else:
                        self.log_test("Quests Daily Generation", False, 
                                    f"Expected 3 quests, got {len(quests)}", data)
                else:
                    self.log_test("Quests Daily Generation", False, "No quests field in response", data)
            else:
                self.log_test("Quests Daily Generation", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Quests Daily", False, f"Exception: {str(e)}")
    
    def test_leaderboard(self):
        """Test 7: Leaderboard returns array"""
        try:
            if not self.user_token:
                self.log_test("Leaderboard", False, "No user token available")
                return
                
            cookies = {'qd4_token': self.user_token}
            
            # Test global leaderboard
            response = self.session.get(f"{self.base_url}/api/leaderboard/global", cookies=cookies)
            
            if response.status_code == 200:
                data = response.json()
                if 'leaderboard' in data and isinstance(data['leaderboard'], list):
                    leaderboard = data['leaderboard']
                    self.log_test("Leaderboard Global", True, 
                                f"Retrieved leaderboard with {len(leaderboard)} users")
                else:
                    self.log_test("Leaderboard Global", False, "No leaderboard array in response", data)
            else:
                self.log_test("Leaderboard Global", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Leaderboard", False, f"Exception: {str(e)}")
    
    def test_background_endpoints(self):
        """Test 8: Background endpoints work"""
        try:
            if not self.user_token:
                self.log_test("Background Endpoints", False, "No user token available")
                return
                
            cookies = {'qd4_token': self.user_token}
            
            # Test GET background
            response = self.session.get(f"{self.base_url}/api/user/background", cookies=cookies)
            
            if response.status_code == 200:
                data = response.json()
                if 'background' in data:
                    self.log_test("Background GET", True, 
                                f"Background: {data.get('background')}, Tokens: {data.get('tokens', 0)}")
                else:
                    self.log_test("Background GET", False, "No background field in response", data)
            else:
                self.log_test("Background GET", False, f"Status: {response.status_code}", response.text)
                return
            
            # Test POST update background
            update_data = {"background": "test-gradient"}
            response = self.session.post(
                f"{self.base_url}/api/user/background/update",
                json=update_data,
                cookies=cookies,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") == True:
                    self.log_test("Background UPDATE", True, f"Background updated to: {data.get('background')}")
                else:
                    self.log_test("Background UPDATE", False, "Background update failed", data)
            else:
                self.log_test("Background UPDATE", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Background Endpoints", False, f"Exception: {str(e)}")
    
    def test_admin_flows(self):
        """Test 9: Admin login sets admin cookie; admin global quests GET works"""
        try:
            # Test admin login
            admin_data = {
                "username": "Rebadion",  # From environment variables
                "password": "Rebadion2010"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/admin/login",
                json=admin_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") == True and 'qd4_admin_token' in response.cookies:
                    self.admin_token = response.cookies['qd4_admin_token']
                    self.log_test("Admin Login", True, "Admin login successful with qd4_admin_token cookie set")
                    
                    # Test admin global quests GET
                    admin_cookies = {'qd4_admin_token': self.admin_token}
                    quests_response = self.session.get(
                        f"{self.base_url}/api/admin/quests/global",
                        cookies=admin_cookies
                    )
                    
                    if quests_response.status_code == 200:
                        quests_data = quests_response.json()
                        if 'quests' in quests_data:
                            self.log_test("Admin Global Quests GET", True, 
                                        f"Retrieved {len(quests_data['quests'])} global quests")
                        else:
                            self.log_test("Admin Global Quests GET", False, 
                                        "No quests field in response", quests_data)
                    else:
                        self.log_test("Admin Global Quests GET", False, 
                                    f"Status: {quests_response.status_code}", quests_response.text)
                else:
                    self.log_test("Admin Login", False, "Admin login failed or cookie not set", data)
            else:
                self.log_test("Admin Login", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Admin Flows", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Next.js Backend Testing Suite")
        print(f"📍 Testing endpoints at: {self.base_url}")
        print("=" * 60)
        
        # Run tests in order
        self.test_health_check()
        self.test_signup()
        self.test_auth_me()
        self.test_login_flows()
        self.test_tasks_crud()
        self.test_quests_daily()
        self.test_leaderboard()
        self.test_background_endpoints()
        self.test_admin_flows()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total} ({(passed/total*100):.1f}%)")
        
        # Show failures
        failures = [result for result in self.test_results if not result['success']]
        if failures:
            print(f"\n❌ FAILURES ({len(failures)}):")
            for failure in failures:
                print(f"   • {failure['test']}: {failure['details']}")
                if failure['response']:
                    print(f"     Response: {failure['response']}")
        
        return passed == total

if __name__ == "__main__":
    tester = NextJSBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)