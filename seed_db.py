import os
import json
import getpass
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment logic
load_dotenv()

url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or os.environ.get("SUPABASE_KEY", "") or os.environ.get("SUPABASE_ANON_KEY", "")

if not url or not key or not url.startswith("http"):
    print("CRITICAL: PLEASE FILL OUT YOUR .ENV FILE WITH VALID URLS BEFORE RUNNING!")
    exit(1)

supabase: Client = create_client(url, key)

print("=== Supabase Database Seeder ===")
print("In order to safely bypass RLS as an admin, please provide your Supabase login credentials:")
email = input("Email: ")
password = getpass.getpass("Password: ")

try:
    print("Logging in...")
    res = supabase.auth.sign_in_with_password({"email": email, "password": password})
    print("Login successful!")
except Exception as e:
    print(f"Login Failed: {e}")
    exit(1)

INITIAL_DATA = {
    "hero": {
        "name": "KISHORE S",
        "role": "AI & Data Science Innovator",
        "description": "Training models to see the unseen. Building intelligent systems and analyzing complex datasets to solve real-world problems.",
        "contact": "+91 9360369359",
        "github": "https://github.com/kishoresenthilkumar007-glitch",
        "linkedin": "https://www.linkedin.com/in/kishore-s-147887380"
    },
    "about": {
        "paragraphs": [
            "I am a passionate AI & Data Science student exploring the intersections of Machine Learning, Neural Networks, and Data Analytics.",
            "Currently focused on deep learning applied to computer vision and natural language processing, I love taking raw data and turning it into actionable intelligence."
        ]
    },
    "skills": {
        "languages": ["Python", "C"],
        "libraries": ["TensorFlow", "PyTorch", "Scikit-Learn", "Pandas", "NumPy", "OpenCV"],
        "tools": ["GitHub", "Jupyter"]
    },
    "projects": [
        {
            "title": "Face Recognition System",
            "description": "A real-time facial recognition pipeline using OpenCV and deep learning embeddings for high accuracy matching.",
            "link": "#",
            "icon": "fa-brain",
            "tech": ["Python", "OpenCV", "Deep Learning"],
            "image": ""
        },
        {
            "title": "Student Performance Analysis",
            "description": "An end-to-end machine learning pipeline that analyzes historical student data to predict academic outcomes, featuring an interactive data visualization dashboard for educators.",
            "link": "#",
            "icon": "fa-graduation-cap",
            "tech": ["Python", "XGBoost", "Streamlit", "Seaborn"],
            "image": ""
        }
    ],
    "achievements": [
        {
            "title": "AI Agent Certificate",
            "date": "2025",
            "description": "Explored the architecture, development, and deployment of autonomous AI agents. Gained hands-on experience building agents that can reason, use tools, and interact with their environments.",
            "image": ""
        },
        {
            "title": "Foundations of Data Science",
            "date": "2025",
            "description": "Mastered the core principles of data wrangling, exploratory data analysis (EDA), statistical foundations, and predictive modeling necessary for extracting actionable insights from data.",
            "image": ""
        },
        {
            "title": "Generative AI with AWS",
            "date": "2025",
            "description": "Deep dive into harnessing Large Language Models (LLMs) and foundation models using AWS services like Amazon Bedrock to build scalable, generative AI applications.",
            "image": ""
        }
    ]
}

# Now upsert directly to Supabase
print("Injecting default data into Supabase portfolio_settings...")
try:
    response = supabase.table('portfolio_settings').upsert({
        'id': 1,
        'data': INITIAL_DATA
    }).execute()
    print("Seeding Complete! Supabase has been successfully populated.")
except Exception as e:
    print(f"Insertion failed! Make sure you executed the RLS Policy in your Supabase dashboard.\nError: {e}")
