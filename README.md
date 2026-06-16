# LearnSphere AI

## Personalized Education – AI Powered Learning and Teaching

LearnSphere AI transforms static study materials into an intelligent learning assistant. Students can upload PDFs, interact with their learning content using natural language, generate summaries, create quizzes, receive personalized recommendations, and track learning progress through an AI-powered platform.

---

## Problem Statement

Students spend significant time navigating lengthy notes, PDFs, presentations, and learning materials while preparing for exams. Traditional study resources lack personalization, intelligent retrieval, and adaptive learning support.

LearnSphere AI addresses these challenges by converting uploaded educational content into an interactive AI-powered tutor capable of answering questions, generating summaries, creating assessments, and recommending personalized learning paths.

---

## Key Features

### AI Chat with Learning Materials

Upload PDFs and ask questions directly from study content.

### Smart Search & Retrieval

Uses page-level retrieval to identify the most relevant content before generating responses.

### Citation-Based Responses

Displays source page references for improved trust and transparency.

### Intelligent Summarization

Generates concise chapter-wise and document-level study notes.

### Quiz Generator

Creates AI-generated MCQs and self-assessment quizzes from uploaded content.

### Personalized Learning Assistant

Provides adaptive explanations and contextual answers.

### Study Recommendations

Analyzes quiz performance and identifies weak areas, revision topics, and study plans.

### Learning Progress Tracker

Tracks:

* Documents Uploaded
* Questions Asked
* Quiz Attempts
* Average Score
* Study Activity

### Secure Authentication

Protected routes with user authentication.

### Responsive Dashboard

Modern dashboard optimized for desktop and mobile devices.

---

## AI Workflow

### Question Answering Pipeline

1. User uploads PDF
2. PDF is converted into page-wise content
3. Smart Retrieval identifies relevant pages
4. Retrieved pages are passed to the LLM
5. LLM generates contextual answer
6. Source citations are displayed

### Quiz Generation Pipeline

1. PDF Content
2. AI Quiz Generator
3. Multiple Choice Questions
4. User Submission
5. Score Evaluation
6. Recommendation Engine

---

## Lightweight RAG Architecture

PDF Upload
↓
PDF Extraction
↓
Page-Based Content Storage
↓
Smart Retrieval
↓
Relevant Context Selection
↓
Gemini / Groq
↓
Answer Generation
↓
Source Citations

---

## Technology Stack

### Frontend

* Next.js 16
* TypeScript
* Tailwind CSS

### Authentication

* NextAuth

### AI Models

* Gemini API
* Groq API (Fallback)

### PDF Processing

* pdf2json

### Deployment

* Vercel

---

## Learning Analytics

The platform tracks:

* Documents Uploaded
* Questions Asked
* Quiz Attempts
* Average Quiz Score
* Learning Activity
* Study Progress

---

## Future Enhancements

* Vector Database Integration
* Embedding-Based Semantic Search
* Multi-Language Support
* Voice-Based Learning Assistant
* AI Study Planner
* Parent & Teacher Dashboard
* LMS Integration
* Advanced Learning Analytics
* Subject-Specific AI Tutors

---

## Impact

* Improves learning efficiency
* Enables self-paced learning
* Enhances concept understanding
* Reduces study time through intelligent retrieval
* Provides personalized educational support

---

## Deployment

Live Application:
[[Vercel Link](https://learn-sphere-ai-ashy.vercel.app/)]



---

