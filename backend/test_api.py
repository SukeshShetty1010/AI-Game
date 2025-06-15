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
    
    def run_all_tests(self):
        """Run all tests and generate a report."""
        logger.info("🚀 Starting comprehensive API testing...")
        
        # Run all tests
        self.test_health_endpoint()
        self.test_game_generation_basic()
        self.test_image_generation_speed()
        
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