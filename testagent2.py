import requests
import json

url = "https://api.ai71.ai/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer ai71-api-4bfc275d-3717-456a-8026-ab8a52c86fa9",
}

payload = {
    "model": "tiiuae/falcon-180B-chat",
    "messages": [
        {"role": "system", "content": "You are a helpful medical assistant"},
        {"role": "user", "content": """What is the meaning of life?"""},
    ],
    "stream": True,
}


def get_streamed_response(url, headers, payload):
    response = requests.post(
        url, headers=headers, data=json.dumps(payload), stream=True
    )
    if response.status_code == 200:
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode("utf-8")
                if decoded_line.startswith("data:"):
                    data = json.loads(decoded_line[len("data:") :])
                    if "choices" in data:
                        delta_content = data["choices"][0]["delta"].get("content", "")
                        if delta_content:
                            print(delta_content, end="", flush=True)
    else:
        print(f"Request failed with status code {response.status_code}")
        print(response.text)


get_streamed_response(url, headers, payload)
