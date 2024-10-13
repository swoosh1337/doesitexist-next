

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import OpenAI from 'openai';

const uri = process.env.MONGODB_URI;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let client;
let database;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  if (!database) {
    database = client.db('app_idea_analyzer');
  }
  return database;
}

export async function GET(request) {
  console.log('GET request received for /api/top-ideas');
  try {
    const db = await connectToDatabase();
    const ideas = db.collection('ideas');

    const topIdeas = await ideas.find().sort({ searches: -1 }).limit(5).toArray();

    console.log(`Returning ${topIdeas.length} top ideas`);
    return NextResponse.json(topIdeas);
  } catch (error) {
    console.error('Error fetching top ideas:', error);
    return NextResponse.json({ error: 'An error occurred while fetching top ideas' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received POST request with body:', body);

    const { userInput } = body;

    if (!userInput) {
      console.log('User input is missing');
      return NextResponse.json({ error: 'User input is required' }, { status: 400 });
    }

    const { appName, description, category } = await generateAppDetails(userInput);

    const db = await connectToDatabase();
    const ideas = db.collection('ideas');

    const result = await ideas.updateOne(
      { appName: appName },
      { 
        $inc: { searches: 1 },
        $setOnInsert: { 
          idea: userInput,
          description: description,
          category: category,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ 
      message: 'Idea saved successfully', 
      appName: appName,
      description: description,
      category: category
    });
  } catch (error) {
    console.error('Error in POST /api/top-ideas:', error);
    return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
  }
}

async function generateAppDetails(userInput) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ 
      role: "user", 
      content: `Based on the following user input, generate a JSON object with an app name (max 3 words), a brief description with key features, and a category. Choose the category from: Social, Productivity, Entertainment, Education, Health & Fitness, Finance, Travel, or Other. 
      
      User input: ${userInput}
      
      Respond with a JSON object in this format:
      {
        "appName": "Short App Name",
        "description": "Brief description with key features",
        "category": "Chosen Category"
      }`
    }],
    max_tokens: 150
  });

  return JSON.parse(response.choices[0].message.content);
}
