import { NextResponse } from 'next/server';
import SerpApi from 'google-search-results-nodejs';
import OpenAI from 'openai';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  console.log('Received search request:', { query });

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const search = new SerpApi.GoogleSearch(process.env.SERPAPI_API_KEY);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const searchResults = await performSearch(search, query);

    const analysisPrompt = `Analyze the following search results for the app idea "${query}" and provide a detailed analysis in JSON format:
    {
      "summary": "A brief summary of the app idea and its potential",
      "existingApps": [
        {
          "name": "App name",
          "description": "Brief description",
          "marketShare": "Estimated market share",
          "revenue": "Estimated revenue if available"
        }
      ],
      "marketAnalysis": {
        "totalMarketSize": "Estimated total market size",
        "growthRate": "Estimated market growth rate",
        "keyPlayers": ["List of key players in the market"],
        "trends": ["List of current market trends"]
      },
      "userDemographics": {
        "ageGroups": ["List of primary age groups"],
        "regions": ["List of primary geographical regions"],
        "interests": ["List of relevant user interests"]
      },
      "monetizationStrategies": ["List of potential monetization strategies"],
      "challenges": ["List of potential challenges or obstacles"],
      "opportunities": ["List of potential opportunities or unique selling points"]
    }
    Base your analysis on the search results and your knowledge of the mobile app market.`;

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: analysisPrompt }],
      max_tokens: 1000
    });

    const analysis = JSON.parse(analysisResponse.choices[0].message.content);

    return NextResponse.json({
      originalQuery: query,
      results: searchResults,
      analysis: analysis
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 });
  }
}

async function performSearch(search, query) {
  return new Promise((resolve, reject) => {
    search.json({
      q: query,
      num: 10,
    }, (result) => {
      resolve(result.organic_results);
    });
  });
}
