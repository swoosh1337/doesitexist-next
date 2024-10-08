import { NextResponse } from 'next/server';
import SerpApi from 'google-search-results-nodejs';
import OpenAI from 'openai';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  console.log('Received search request:', { query });
  console.log('Original search query:', query);

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // Initialize clients inside the handler
    const search = new SerpApi.GoogleSearch(process.env.SERPAPI_API_KEY);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const gptPrompt = `Given the app idea: "${query}", generate three separate search queries:
    1. A query to find similar web apps on Google
    2. A query optimized for the Apple App Store
    3. A query optimized for the Google Play Store
    Format the response as JSON with keys: googleQuery, appStoreQuery, playStoreQuery`;

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: gptPrompt }],
      max_tokens: 150
    });

    const searchQueries = JSON.parse(gptResponse.choices[0].message.content);
    console.log('GPT-generated search queries:', searchQueries);

    // Pass the `search` instance to the helper functions
    const [googleResults, appStoreResults, playStoreResults] = await Promise.all([
      performGoogleSearch(search, searchQueries.googleQuery),
      performAppStoreSearch(search, searchQueries.appStoreQuery),
      performPlayStoreSearch(search, searchQueries.playStoreQuery)
    ]);

    const combinedResults = [...googleResults, ...appStoreResults, ...playStoreResults];

    if (combinedResults.length === 0) {
      return NextResponse.json({
        originalQuery: query,
        searchQueries: searchQueries,
        results: [],
        analysis: "No results found across all platforms for this query."
      });
    }

    const analysisPrompt = `Analyze the following search results for the mobile or web app idea "${query}" and identify the top 5 most similar existing apps. In the end tell
    if such app exists or what apps are most similar to that app idea. Also tell if the apps are profitable, if they have revenue, how are they making money
    and in what regions. Provide a summary of the global market potential in the following format:
    MARKET_SUMMARY
    Existing Markets: [comma-separated list of regions where the app already exists]
    Potential Markets: [comma-separated list of regions with high potential for the app]
    Challenging Markets: [comma-separated list of regions where the app might face difficulties]
    END_MARKET_SUMMARY`;

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: analysisPrompt }],
      max_tokens: 300
    });

    const analysis = analysisResponse.choices[0].message.content;

    return NextResponse.json({ 
      originalQuery: query,
      searchQueries: searchQueries,
      results: combinedResults,
      analysis: analysis
    });

  } catch (error) {
    console.error('Search error:', error);
    let errorMessage = 'An error occurred during the search';
    let errorDetails = error.message;

    if (error.message.includes('SerpAPI error')) {
      errorMessage = 'Error in search API';
    } else if (error.message.includes('Unexpected SerpAPI response structure')) {
      errorMessage = 'Unexpected search results format';
    }

    return NextResponse.json({ 
      error: errorMessage, 
      details: errorDetails,
      query: query
    }, { status: 500 });
  }
}

// Update helper functions to accept `search` as a parameter
async function performGoogleSearch(search, query) {
  return new Promise((resolve, reject) => {
    search.json({
      q: query,
      location: 'United States',
      num: 5
    }, (data) => {
      if (data && data.organic_results) {
        const filteredResults = data.organic_results
          .filter(result => result.title && result.snippet)
          .map(result => ({
            title: result.title,
            link: result.link || `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            snippet: truncateDescription(result.snippet, 100),
            source: 'Google'
          }));
        resolve(filteredResults);
      } else {
        reject(new Error('Unexpected SerpAPI response structure for Google'));
      }
    }, (error) => {
      reject(error);
    });
  });
}

async function performAppStoreSearch(search, query) {
  return new Promise((resolve, reject) => {
    search.json({
      engine: "apple_app_store",
      term: query,
      num: 5
    }, (data) => {
      console.log('App Store search response:', JSON.stringify(data, null, 2));
      if (data && Array.isArray(data.organic_results)) {
        const filteredResults = data.organic_results
          .filter(result => result.title && result.description)
          .map(result => ({
            title: result.title,
            link: result.app_store_url || `https://apps.apple.com/search?term=${encodeURIComponent(query)}`,
            snippet: truncateDescription(result.description, 100),
            source: 'App Store'
          }));
        resolve(filteredResults);
      } else if (data && data.error) {
        console.warn(`App Store search warning: ${data.error}`);
        resolve([]);
      } else {
        console.warn('Unexpected App Store search response:', JSON.stringify(data));
        resolve([]);
      }
    }, (error) => {
      console.error('App Store search error:', error);
      resolve([]);
    });
  });
}

async function performPlayStoreSearch(search, query) {
  return new Promise((resolve, reject) => {
    search.json({
      engine: "google_play",
      q: query,
      num: 5
    }, (data) => {
      console.log('Play Store search response:', JSON.stringify(data, null, 2));
      if (data && Array.isArray(data.organic_results)) {
        const filteredResults = data.organic_results
          .filter(result => result.title && result.description)
          .map(result => ({
            title: result.title,
            link: result.link || `https://play.google.com/store/search?q=${encodeURIComponent(query)}`,
            snippet: truncateDescription(result.description, 100),
            source: 'Google Play Store'
          }));
        resolve(filteredResults);
      } else if (data && data.error) {
        console.warn(`Play Store search warning: ${data.error}`);
        resolve([]);
      } else {
        console.warn('Unexpected Play Store search response:', JSON.stringify(data));
        resolve([]);
      }
    }, (error) => {
      console.error('Play Store search error:', error);
      resolve([]);
    });
  });
}

function truncateDescription(description, maxLength) {
  if (!description) return '';
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength - 3) + '...';
}
