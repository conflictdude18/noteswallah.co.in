import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const text = body.text;

    if (!text) {
      return NextResponse.json(
        { error: "Missing text" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const result = await model.generateContent(`
You are Notique AI from NotesWallah.

Create a clean study summary using this format:

Topic Overview
2-3 simple lines.

Key Points
- Important definitions
- Core concepts
- Main ideas

Exam Revision
- Very short revision notes
- Important facts only

Quick Recall
- 3 important one-line takeaways

Use:
- simple student language
- clean formatting
- short paragraphs
- readable spacing

Study material:
${text}
`);

    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("GEMINI ERROR:", error);

    let message = "AI service temporarily unavailable.";

    if (error?.message?.includes("429")) {
      message = "Notique AI has reached its usage limit. Please try again later.";
    }

    if (error?.message?.includes("503")) {
      message = "Notique AI is currently busy. Please try again in a few minutes.";
    }

    return NextResponse.json({ error: message }, { status: 200 });
  }
}