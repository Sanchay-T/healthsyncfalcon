from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import io
import json
import aiohttp
import logging
import traceback
import asyncio

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

active_websockets = set()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    finally:
        active_websockets.remove(websocket)


async def send_status_update(message: str):
    for websocket in active_websockets:
        await websocket.send_json({"status": message})


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    await send_status_update("Received file. Starting analysis...")
    logger.info(f"Received file: {file.filename}")
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        content = await file.read()
        await send_status_update(
            f"File size: {len(content)} bytes. Extracting content..."
        )
        logger.info(f"File size: {len(content)} bytes")

        pdf_content = await extract_pdf_content(content)
        await send_status_update(
            f"Extracted {len(pdf_content)} characters from PDF. Analyzing..."
        )
        logger.info(f"Extracted PDF content length: {len(pdf_content)} characters")

        analysis = await analyze_medical_report(pdf_content)
        await send_status_update("Analysis completed successfully.")
        logger.info("Analysis completed successfully")
        return analysis
    except Exception as e:
        error_message = f"Error processing file: {str(e)}"
        await send_status_update(error_message)
        logger.error(error_message)
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_message)


async def extract_pdf_content(content: bytes) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for i, page in enumerate(pdf_reader.pages):
            text += page.extract_text() + "\n"
            await send_status_update(f"Extracted page {i+1} of {len(pdf_reader.pages)}")
        logger.info(f"Extracted {len(pdf_reader.pages)} pages from PDF")
        return text
    except Exception as e:
        logger.error(f"Error extracting PDF content: {str(e)}")
        logger.error(traceback.format_exc())
        raise


async def analyze_medical_report(report_content: str) -> dict:
    logger.info("Analyzing medical report")
    await send_status_update("Analyzing medical report...")

    max_chunk_size = 1500
    chunks = [
        report_content[i : i + max_chunk_size]
        for i in range(0, len(report_content), max_chunk_size)
    ]

    all_results = []

    async with aiohttp.ClientSession() as session:
        for i, chunk in enumerate(chunks):
            await send_status_update(f"Processing chunk {i+1} of {len(chunks)}...")
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
                    {{
                        "chart_type": "bar",
                        "title": "Chart Title",
                        "data": [
                            {{"label": "Category1", "value1": Number1, "value2": Number2, ...}},
                            {{"label": "Category2", "value1": Number1, "value2": Number2, ...}},
                            ...
                        ]
                    }},
                    {{
                        "chart_type": "area",
                        "title": "Chart Title",
                        "x_axis_key": "month",
                        "data_keys": ["value1", "value2", ...],
                        "data": [
                            {{"month": "January", "value1": Number1, "value2": Number2, ...}},
                            {{"month": "February", "value1": Number1, "value2": Number2, ...}},
                            ...
                        ],
                        "trend_percentage": 5.2,
                        "date_range": "January - June 2024"
                    }}
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
                await send_status_update(f"Sending request to AI model for chunk {i+1}")
                async with session.post(
                    API_URL, headers=headers, json=payload
                ) as response:
                    response.raise_for_status()
                    result = await response.json()
                    await send_status_update(
                        f"Received response from AI model for chunk {i+1}"
                    )

                parsed_content = json.loads(result["choices"][0]["message"]["content"])
                all_results.append(parsed_content)
                await send_status_update(
                    f"Successfully parsed AI model response for chunk {i+1}"
                )
            except Exception as e:
                error_message = f"Error processing chunk {i+1}: {str(e)}"
                await send_status_update(error_message)
                logger.error(error_message)
                logger.error(traceback.format_exc())

    combined_results = {
        "summary": " ".join([r["summary"] for r in all_results]),
        "abnormal_results": [
            item for r in all_results for item in r.get("abnormal_results", [])
        ],
        "charts": [item for r in all_results for item in r.get("charts", [])],
        "recommendations": [
            item for r in all_results for item in r.get("recommendations", [])
        ],
    }

    await send_status_update("Analysis completed. Preparing final results...")
    return combined_results


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
