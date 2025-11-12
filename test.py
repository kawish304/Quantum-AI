# test.py
import requests
import json

def test_api():
    # Test 1: Status check
    print("🔍 Testing API Status...")
    try:
        response = requests.get("http://localhost:8000/api/status")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Status test failed: {e}")
        return

    # Test 2: Simple chat
    print("\n🔍 Testing Chat...")
    try:
        payload = {
            "feature": "chat",
            "message": "Hello from Pakistan! What can you do?",
            "model": "llama3-70b-8192"
        }
        response = requests.post("http://localhost:8000/api/chat", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Chat test failed: {e}")

    # Test 3: Demo mode test (without GROQ API key)
    print("\n🔍 Testing Demo Mode...")
    try:
        payload = {
            "feature": "chat", 
            "message": "Tell me about Pakistan",
            "model": "llama3-8b-8192"
        }
        response = requests.post("http://localhost:8000/api/chat", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print("✅ Demo response received!")
        print(f"Feature: {data.get('feature')}")
        print(f"Response length: {len(data.get('response', ''))} characters")
    except Exception as e:
        print(f"❌ Demo test failed: {e}")

if __name__ == "__main__":
    test_api()