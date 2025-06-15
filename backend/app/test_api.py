"""
Comprehensive API Testing Script for AI LoreCrafter

This script tests all aspects of the API including:
- Game generation
- Image generation
- Performance metrics
- Error handling
"""

import asyncio
import time
import json
import requests
from typing import Dict, Any, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"

class APITester:
    """Comprehensive API testing class."""
    
    def __init__(self):
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_test_result(self, test_name: str, success: bool, duration: float, details: str = ""):
        """Log a test result."""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            
        result = {
            "test": test_name,
            "success": success,
            "duration": duration,
            "details": details
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} {test_name} ({duration:.2f}s) - {details}")
    
    def test_health_endpoint(self):
        """Test the health check endpoint."""
        start_time = time.time()
        try:
            response = requests.get(f"{BASE_URL}/health")
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.log_test_result("Health Check", True, duration, f"Status: {data.get('status')}")
            else:
                self.log_test_result("Health Check", False, duration, f"Status code: {response.status_code}")
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test_result("Health Check", False, duration, f"Error: {str(e)}")
    
    def test_game_generation_basic(self):
        """Test basic game generation."""
        start_time = time.time()
        try:
            payload = {"prompt": "A brave knight in a magical forest"}
            response = requests.post(
                f"{BASE_URL}/api/generateGame",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                game_data = data.get("game_data", {})
                
                # Check required fields
                required_fields = ["setting", "protagonist_role", "objective", "npc", "hook"]
                missing_fields = [field for field in required_fields if field not in game_data]
                
                if not missing_fields:
                    images = game_data.get("images", {})
                    image_count = sum(1 for v in images.values() if v)
                    self.log_test_result("Basic Game Generation", True, duration, 
                                       f"Generated {image_count} images, setting: {game_data.get('setting')}")
                else:
                    self.log_test_result("Basic Game Generation", False, duration, 
                                       f"Missing fields: {missing_fields}")
            else:
                self.log_test_result("Basic Game Generation", False, duration, 
                                   f"Status code: {response.status_code}")
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test_result("Basic Game Generation", False, duration, f"Error: {str(e)}")
    
    def test_game_generation_different_prompts(self):
        """Test game generation with different types of prompts."""
        test_prompts = [
            "A wizard in a dark dungeon",
            "A pirate on a treasure island",
            "A space explorer on an alien planet",
            "A detective in a noir city",
            "A farmer defending their village"
        ]
        
        for i, prompt in enumerate(test_prompts):
            start_time = time.time()
            try:
                payload = {"prompt": prompt}
                response = requests.post(
                    f"{BASE_URL}/api/generateGame",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                duration = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    game_data = data.get("game_data", {})
                    setting = game_data.get("setting", "Unknown")
                    self.log_test_result(f"Prompt Test {i+1}", True, duration, 
                                       f"'{prompt}' -> '{setting}'")
                else:
                    self.log_test_result(f"Prompt Test {i+1}", False, duration, 
                                       f"Status code: {response.status_code}")
                    
            except Exception as e:
                duration = time.time() - start_time
                self.log_test_result(f"Prompt Test {i+1}", False, duration, f"Error: {str(e)}")
    
    def test_image_generation_speed(self):
        """Test image generation speed."""
        start_time = time.time()
        try:
            payload = {"prompt": "A fast test for image generation"}
            response = requests.post(
                f"{BASE_URL}/api/generateGame",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                images = data.get("game_data", {}).get("images", {})
                image_count = sum(1 for v in images.values() if v)
                
                # Check if generation was fast (under 5 seconds for ultra-fast generation)
                if duration < 5.0:
                    self.log_test_result("Ultra-Fast Image Generation", True, duration, 
                                       f"Generated {image_count} images in {duration:.2f}s")
                else:
                    self.log_test_result("Ultra-Fast Image Generation", False, duration, 
                                       f"Too slow: {duration:.2f}s for {image_count} images")
            else:
                self.log_test_result("Ultra-Fast Image Generation", False, duration, 
                                   f"Status code: {response.status_code}")
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test_result("Ultra-Fast Image Generation", False, duration, f"Error: {str(e)}")
    
    def test_error_handling(self):
        """Test error handling with invalid requests."""
        start_time = time.time()
        try:
            # Test with empty prompt
            payload = {"prompt": ""}
            response = requests.post(
                f"{BASE_URL}/api/generateGame",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            duration = time.time() - start_time
            
            # Should handle empty prompt gracefully
            if response.status_code in [200, 400, 422]:
                self.log_test_result("Error Handling", True, duration, 
                                   f"Handled empty prompt correctly: {response.status_code}")
            else:
                self.log_test_result("Error Handling", False, duration, 
                                   f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test_result("Error Handling", False, duration, f"Error: {str(e)}")
    
    def test_concurrent_requests(self):
        """Test handling of concurrent requests."""
        import threading
        
        results = []
        
        def make_request():
            try:
                payload = {"prompt": f"Concurrent test {threading.current_thread().ident}"}
                response = requests.post(
                    f"{BASE_URL}/api/generateGame",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                results.append(response.status_code == 200)
            except:
                results.append(False)
        
        start_time = time.time()
        threads = []
        
        # Create 3 concurrent requests
        for i in range(3):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        duration = time.time() - start_time
        success_count = sum(results)
        
        if success_count >= 2:  # At least 2 out of 3 should succeed
            self.log_test_result("Concurrent Requests", True, duration, 
                               f"{success_count}/3 requests succeeded")
        else:
            self.log_test_result("Concurrent Requests", False, duration, 
                               f"Only {success_count}/3 requests succeeded")
    
    def run_all_tests(self):
        """Run all tests and generate a report."""
        logger.info("🚀 Starting comprehensive API testing...")
        
        # Run all tests
        self.test_health_endpoint()
        self.test_game_generation_basic()
        self.test_image_generation_speed()
        self.test_game_generation_different_prompts()
        self.test_error_handling()
        self.test_concurrent_requests()
        
        # Generate report
        self.generate_report()
    
    def generate_report(self):
        """Generate a comprehensive test report."""
        logger.info("\n" + "="*60)
        logger.info("📊 COMPREHENSIVE TEST REPORT")
        logger.info("="*60)
        
        logger.info(f"Total Tests: {self.total_tests}")
        logger.info(f"Passed: {self.passed_tests}")
        logger.info(f"Failed: {self.total_tests - self.passed_tests}")
        logger.info(f"Success Rate: {(self.passed_tests/self.total_tests)*100:.1f}%")
        
        # Performance metrics
        durations = [r["duration"] for r in self.results if r["success"]]
        if durations:
            avg_duration = sum(durations) / len(durations)
            max_duration = max(durations)
            min_duration = min(durations)
            
            logger.info(f"\n⚡ PERFORMANCE METRICS:")
            logger.info(f"Average Response Time: {avg_duration:.2f}s")
            logger.info(f"Fastest Response: {min_duration:.2f}s")
            logger.info(f"Slowest Response: {max_duration:.2f}s")
        
        # Failed tests
        failed_tests = [r for r in self.results if not r["success"]]
        if failed_tests:
            logger.info(f"\n❌ FAILED TESTS:")
            for test in failed_tests:
                logger.info(f"  - {test['test']}: {test['details']}")
        
        logger.info("\n" + "="*60)
        
        if self.passed_tests == self.total_tests:
            logger.info("🎉 ALL TESTS PASSED! The API is working perfectly!")
        else:
            logger.info(f"⚠️  {self.total_tests - self.passed_tests} tests failed. Check the details above.")
        
        logger.info("="*60)


def main():
    """Main function to run the tests."""
    tester = APITester()
    tester.run_all_tests()


if __name__ == "__main__":
    main() 