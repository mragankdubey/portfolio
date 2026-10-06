from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
import os
import smtplib
from email.message import EmailMessage


load_dotenv()

app = FastAPI(title="JARVIS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set")

client = genai.Client(api_key=GEMINI_API_KEY)

class ChatRequest(BaseModel):
    message: str

class ContactRequest(BaseModel):
    name: str
    email: str
    message: str

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "JARVIS"
    }


JARVIS_SYSTEM_PROMPT = """
You are JARVIS, the personal AI assistant for Mragank Dubey's
developer portfolio website.

Your purpose is to answer questions about Mragank, his portfolio,
skills, projects, interests, learning journey, and career goals.

PERSONALITY:
- Speak like a futuristic personal AI assistant.
- Be concise, clear and helpful.
- Maintain a professional but slightly futuristic JARVIS-like tone.
- Do not overuse dramatic phrases.
- Do not pretend to have capabilities you do not have.
- Do not make up information about Mragank.
- If you don't know something, clearly say that you don't have
  that information.

ABOUT MRAGANK:
- Name: Mragank Dubey
- Education: BTech CSE (AI & ML)
- Goal: Aspiring AI Engineer
- Interests: AI-powered applications, backend development,
  practical software projects and intelligent interfaces.
- Currently learning: FastAPI, SQL and AI/ML foundations.

TECHNOLOGIES:
- Python
- HTML
- CSS
- JavaScript
- FastAPI
- SQL
- AI/ML

PROJECTS:
- CareerBridge
- To-Do List
- Netflix Clone
- BrawlDex

CAREER DIRECTION:
Mragank is currently focused on developing practical software
engineering skills while progressing toward AI engineering and
intelligent systems.

CONTACT:
Visitors can contact Mragank through the Contact section of
the portfolio or through the social links in the footer.

IMPORTANT:
Only use the information provided in this instruction when
answering portfolio-specific questions. Do not invent projects,
achievements, technologies, education, experience or personal
details that are not provided here.

If someone asks something unrelated to Mragank or the portfolio,
you can answer briefly if it is a normal general question, but
your primary role is to assist visitors exploring the portfolio.
"""

@app.post("/chat")
async def chat(request: ChatRequest):

    response = client.models.generate_content(
    model="gemini-3.8-flash",
    contents=request.message,
    config=types.GenerateContentConfig(
    system_instruction=JARVIS_SYSTEM_PROMPT
    )
)   
    return {"response": response.text}

@app.post("/contact")
def contact(request: ContactRequest):

    email = EmailMessage()

    email["Subject"] = f"Portfolio Contact: {request.name}"
    email["From"] = os.getenv("SMTP_EMAIL")
    email["To"] = os.getenv("CONTACT_EMAIL")
    email["Reply-To"] = request.email

    email.set_content(
        f"""
NEW PORTFOLIO MESSAGE
=====================

Name:
{request.name}

Email:
{request.email}

Message:
{request.message}

=====================
Sent from Mragank's Portfolio
"""
    )

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:

            server.starttls()

            server.login(
                os.getenv("SMTP_EMAIL"),
                os.getenv("SMTP_PASSWORD")
            )

            server.send_message(email)

        return {
            "success": True,
            "message": "Message sent successfully."
        }

    except Exception as error:

        print("Email error:", error)

        return {
            "success": False,
            "message": "Unable to send message."
        }