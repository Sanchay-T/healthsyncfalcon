from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import io
import json
import requests
import logging
import traceback

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_URL = "https://api.ai71.ai/v1/chat/completions"
API_KEY = "ai71-api-4bfc275d-3717-456a-8026-ab8a52c86fa9"


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    logger.info(f"Received file: {file.filename}")
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        content = await file.read()
        logger.info(f"File size: {len(content)} bytes")

        pdf_content = extract_pdf_content(content)
        logger.info(f"Extracted PDF content length: {len(pdf_content)} characters")

        analysis = analyze_medical_report(pdf_content)
        logger.info("Analysis completed successfully")
        return analysis
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


def extract_pdf_content(content: bytes) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        logger.info(f"Extracted {len(pdf_reader.pages)} pages from PDF")
        return text
    except Exception as e:
        logger.error(f"Error extracting PDF content: {str(e)}")
        logger.error(traceback.format_exc())
        raise


def analyze_medical_report(report_content: str) -> dict:
    logger.info("Analyzing medical report")

    # Split the report into smaller chunks
    max_chunk_size = 4000  # Adjust this value as needed
    chunks = [
        report_content[i : i + max_chunk_size]
        for i in range(0, len(report_content), max_chunk_size)
    ]

    all_results = []

    for i, chunk in enumerate(chunks):
        logger.info(f"Processing chunk {i+1} of {len(chunks)}")
        prompt = f"""
        Analyze the following part of a medical report and extract key information. 
        Return the results in a JSON format with the following structure:
        {{
            "summary": "A brief summary of this part of the report",
            "abnormal_results": [
                {{"test_name": "Test Name", "value": "Abnormal Value", "reference_range": "Normal Range", "interpretation": "Brief interpretation"}}
            ],
            "charts": [
                {{"chart_type": "bar/line/pie", "title": "Chart Title", "data": [{{"label": "Label1", "value": Value1}}, ...]}}
            ],
            "recommendations": ["Recommendation 1", "Recommendation 2", ...]
        }}

        Medical Report Part {i+1}/{len(chunks)}:
        {chunk}
        """

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        }
        payload = {
            "model": "tiiuae/falcon-180B-chat",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a medical expert analyzing health reports.",
                },
                {"role": "user", "content": prompt},
            ],
        }

        try:
            logger.info(f"Sending request to AI model for chunk {i+1}")
            response = requests.post(API_URL, headers=headers, json=payload)
            response.raise_for_status()
            logger.info(
                f"Received response from AI model for chunk {i+1}: Status {response.status_code}"
            )

            result = response.json()
            logger.debug(f"AI model response for chunk {i+1}: {result}")

            parsed_content = json.loads(result["choices"][0]["message"]["content"])
            all_results.append(parsed_content)
            logger.info(f"Successfully parsed AI model response for chunk {i+1}")
        except Exception as e:
            logger.error(f"Error processing chunk {i+1}: {str(e)}")
            logger.error(traceback.format_exc())

    # Combine results from all chunks
    combined_results = {
        "summary": " ".join([r["summary"] for r in all_results]),
        "abnormal_results": [
            item for r in all_results for item in r["abnormal_results"]
        ],
        "charts": [item for r in all_results for item in r["charts"]],
        "recommendations": [item for r in all_results for item in r["recommendations"]],
    }

    return combined_results


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
