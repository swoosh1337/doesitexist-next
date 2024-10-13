'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = '/api';

const TopIdeasComponent = ({ topIdeas }) => {
  const [selectedIdea, setSelectedIdea] = useState(null);

  // Sort topIdeas by searches in descending order
  const sortedIdeas = [...topIdeas].sort((a, b) => b.searches - a.searches);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm">
      <h3 className="text-xl font-semibold mb-3 text-gray-800">Top 5 Popular Ideas</h3>
      <ul className="space-y-2">
        {sortedIdeas.map((idea, index) => (
          <li key={index} className="flex justify-between items-center">
            <button
              onClick={() => setSelectedIdea(idea)}
              className="text-blue-600 hover:text-blue-800 transition duration-300"
            >
              {idea.appName}
            </button>
            <span className="text-sm text-gray-500">{idea.category}</span>
          </li>
        ))}
      </ul>
      {selectedIdea && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-semibold text-gray-800">{selectedIdea.appName}</h4>
          <p className="text-sm text-gray-600">{selectedIdea.description}</p>
          <p className="text-xs text-gray-500 mt-2">Searches: {selectedIdea.searches}</p>
        </div>
      )}
    </div>
  );
};

const SearchComponent = () => {
  const [userInput, setUserInput] = useState('');
  const [topIdeas, setTopIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisText, setAnalysisText] = useState(null);
  const [previousSearches, setPreviousSearches] = useState([]);
  const fetchedRef = useRef(false);
  const fetchingRef = useRef(false);

  const fetchTopIdeas = useCallback(async () => {
    if (fetchedRef.current || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const response = await axios.get(`${API_URL}/top-ideas`);
      setTopIdeas(response.data);
      fetchedRef.current = true;
    } catch (error) {
      console.error('Error fetching top ideas:', error);
      setError('Failed to fetch top ideas');
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchTopIdeas();
    const savedSearches = JSON.parse(localStorage.getItem('previousSearches')) || [];
    setPreviousSearches(savedSearches);
  }, [fetchTopIdeas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setAnalysisText(null);
    try {
      // Save the idea
      await axios.post(`${API_URL}/top-ideas`, { userInput });

      // Perform the analysis
      const analysisResponse = await axios.get(`${API_URL}/search?query=${encodeURIComponent(userInput)}`);
      console.log('Analysis response:', analysisResponse.data);
      if (analysisResponse.data && analysisResponse.data.analysis) {
        setAnalysisText(analysisResponse.data.analysis);
        
        // Update previous searches
        const newSearch = { query: userInput, date: new Date().toLocaleString() };
        const updatedSearches = [newSearch, ...previousSearches.slice(0, 4)];
        setPreviousSearches(updatedSearches);
        localStorage.setItem('previousSearches', JSON.stringify(updatedSearches));
      } else {
        setError('No analysis found');
      }

      // Fetch updated top ideas
      await fetchTopIdeas();

      setUserInput('');
    } catch (error) {
      console.error('Error processing app idea:', error);
      setError('Failed to process app idea');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAppLink = (app) => {
    if (app.link) {
      return (
        <a href={app.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {app.name}
        </a>
      );
    }
    return app.name;
  };

  const formatMarketShareRevenue = (marketShare, revenue) => {
    let result = '';
    if (marketShare && !isNaN(parseFloat(marketShare))) {
      result += `Market Share: ${marketShare}%`;
    }
    if (revenue && !isNaN(parseFloat(revenue))) {
      if (result) result += ' | ';
      result += `Revenue: $${revenue}`;
    }
    return result || 'No market share or revenue data available';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col">
      <header className="bg-white shadow-md p-6">
        <h1 className="text-4xl font-bold text-center text-gray-800">App Idea Analyzer</h1>
      </header>
      <main className="flex-grow p-6 overflow-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
          <div className="md:w-2/3">
            <motion.form
              onSubmit={handleSubmit}
              className="mb-8 bg-white p-6 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter your app idea or description"
                className="w-full p-4 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500 text-lg"
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-md hover:from-blue-600 hover:to-purple-700 transition duration-300 font-semibold text-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Analyzing...' : 'Analyze App Idea'}
              </button>
            </motion.form>

            {error && (
              <motion.div
                className="text-red-500 mb-4 bg-red-100 p-4 rounded-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {error}
              </motion.div>
            )}

            {analysisText && (
              <motion.div
                className="mb-8 bg-white p-6 rounded-lg shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Analysis</h2>
                <div className="text-gray-700">
                  <h3 className="text-xl font-semibold mt-2 mb-1">Summary</h3>
                  <p>{analysisText.summary}</p>

                  <h3 className="text-xl font-semibold mt-4 mb-1">Existing Apps</h3>
                  <ul className="list-disc pl-5">
                    {analysisText.existingApps.map((app, index) => (
                      <li key={index}>
                        <strong>{renderAppLink(app)}</strong>: {app.description}
                        <br />
                        <span className="text-sm text-gray-500">
                          {formatMarketShareRevenue(app.marketShare, app.revenue)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-1">Market Analysis</h3>
                  <p><strong>Total Market Size:</strong> {analysisText.marketAnalysis.totalMarketSize}</p>
                  <p><strong>Growth Rate:</strong> {analysisText.marketAnalysis.growthRate}</p>
                  <p><strong>Key Players:</strong> {analysisText.marketAnalysis.keyPlayers.join(', ')}</p>
                  <p><strong>Trends:</strong> {analysisText.marketAnalysis.trends.join(', ')}</p>

                  <h3 className="text-xl font-semibold mt-4 mb-1">User Demographics</h3>
                  <p><strong>Age Groups:</strong> {analysisText.userDemographics.ageGroups.join(', ')}</p>
                  <p><strong>Regions:</strong> {analysisText.userDemographics.regions.join(', ')}</p>
                  <p><strong>Interests:</strong> {analysisText.userDemographics.interests.join(', ')}</p>

                  <h3 className="text-xl font-semibold mt-4 mb-1">Monetization Strategies</h3>
                  <ul className="list-disc pl-5">
                    {analysisText.monetizationStrategies.map((strategy, index) => (
                      <li key={index}>{strategy}</li>
                    ))}
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-1">Challenges</h3>
                  <ul className="list-disc pl-5">
                    {analysisText.challenges.map((challenge, index) => (
                      <li key={index}>{challenge}</li>
                    ))}
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-1">Opportunities</h3>
                  <ul className="list-disc pl-5">
                    {analysisText.opportunities.map((opportunity, index) => (
                      <li key={index}>{opportunity}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Previous Searches</h2>
              <ul>
                {previousSearches.map((search, index) => (
                  <li key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <span className="text-gray-700">{search.query}</span>
                    <span className="text-gray-500 text-sm">{search.date}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
          <div className="md:w-1/3">
            <TopIdeasComponent topIdeas={topIdeas} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchComponent;
