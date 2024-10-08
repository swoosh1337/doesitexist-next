import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  console.log('Received query:', query);

  if (!query) {
    console.log('No query parameter found');
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ 
        role: "user", 
        content: `For the app idea "${query}", provide a JSON object with the following structure:
        {
          "globeData": {
            "existing": [array of ISO 3166-1 alpha-2 country codes where the app already exists],
            "potential": [array of ISO 3166-1 alpha-2 country codes where the app has high potential],
            "challenging": [array of ISO 3166-1 alpha-2 country codes where the app might face challenges]
          },
          "analysis": {
            "existing": "Brief explanation of why the app exists in these markets",
            "potential": "Brief explanation of why these markets have high potential",
            "challenging": "Brief explanation of why these markets might be challenging"
          }
        }
        Ensure each array has at least one country code, and provide concise explanations.` 
      }],
      max_tokens: 500
    });

    let data = JSON.parse(response.choices[0].message.content);
    
    // Ensure each array has at least one item
    if (!data.globeData.existing.length) data.globeData.existing = ['US'];
    if (!data.globeData.potential.length) data.globeData.potential = ['GB'];
    if (!data.globeData.challenging.length) data.globeData.challenging = ['CN'];
    
    console.log('Sending globe data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Globe data error:', error);
    return NextResponse.json({ error: 'Failed to generate globe data' }, { status: 500 });
  }
}