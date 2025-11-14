import requests
import json

def test_api():
    base_url = "http://localhost:8000"  # or "http://127.0.0.1:8000"
    
    # Test 1: Status check
    print("🔍 Testing API Status...")
    try:
        response = requests.get(f"{base_url}/api/status", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Status test failed: {e}")
        return
    
    # Test 2: Simple chat (with valid model)
    print("\n🔍 Testing Chat...")
    try:
        payload = {
            "feature": "chat",
            "message": "Hello from Pakistan! What can you do?",
            "model": "llama-3.3-70b-versatile"  # Fixed: Matches main.py models
        }
        response = requests.post(f"{base_url}/api/chat", json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Chat test failed: {e}")
    
    # Test 3: Demo mode test (with another valid model, no API key needed)
    print("\n🔍 Testing Demo Mode...")
    try:
        payload = {
            "feature": "chat",
            "message": "Tell me about Pakistan",
            "model": "llama-3.1-8b-instant"  # Fixed: Matches main.py
        }
        response = requests.post(f"{base_url}/api/chat", json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        data = response.json()
        print("✅ Demo response received!")
        print(f"Feature: {data.get('feature')}")
        print(f"Model: {data.get('model')}")
        print(f"Detected Domain: {data.get('detected_domain')}")
        print(f"Response length: {len(data.get('response', ''))} characters")
        print(f"Sample Response: {data.get('response', '')[:200]}...")  # Truncated preview
    except Exception as e:
        print(f"❌ Demo test failed: {e}")

if __name__ == "__main__":
    test_api()
    print("\nAll tests done! 🚀 If server not running, start with: python main.py")