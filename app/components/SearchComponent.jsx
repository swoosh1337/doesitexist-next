'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = '/api';

const SearchComponent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [analysisText, setAnalysisText] = useState(null);
  const [globeAnalysis, setGlobeAnalysis] = useState(null); 
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previousSearches, setPreviousSearches] = useState([]);
  const [showGlobe, setShowGlobe] = useState(false);
  const [globeData, setGlobeData] = useState(null);
  const [lastSuccessfulQuery, setLastSuccessfulQuery] = useState('');

  useEffect(() => {
    // Load previous searches from localStorage on component mount
    const savedSearches = JSON.parse(localStorage.getItem('previousSearches')) || [];
    setPreviousSearches(savedSearches);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setSearchResults(null);
    setAnalysisText(null);
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/search?query=${encodeURIComponent(searchQuery)}`);
      console.log('Search response:', response.data);
      if (response.data && response.data.results && response.data.results.length > 0) {
        setSearchResults(response.data.results);
        setAnalysisText(response.data.analysis); // Use setAnalysisText here
        setLastSuccessfulQuery(searchQuery); // Store the successful query
      } else {
        setError('No results found');
      }
      // Add current search to previousSearches
      const newSearch = { query: searchQuery, date: new Date().toLocaleString() };
      const updatedSearches = [newSearch, ...previousSearches.slice(0, 4)];
      setPreviousSearches(updatedSearches);
      localStorage.setItem('previousSearches', JSON.stringify(updatedSearches));
      setSearchQuery('');
    } catch (error) {
      console.error('Search error:', error);
      setError(`An error occurred while searching: ${error.message}`);
      if (error.response) {
        console.error('Error response:', error.response.data);
        setError(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('Error request:', error.request);
        setError('No response received from the server. Please check your network connection.');
      } else {
        console.error('Error message:', error.message);
        setError(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleGlobeVisualization = async () => {
    setShowGlobe(true);
    setError(null);
    try {
      console.log('Last successful query:', lastSuccessfulQuery);
      if (!lastSuccessfulQuery) {
        throw new Error('Please perform a search first');
      }
      console.log('Sending request to:', `${API_URL}/globe-data`);
      const response = await axios.get(`${API_URL}/globe-data`, {
        params: { query: lastSuccessfulQuery }
      });
      console.log('Globe data response:', response);
      setGlobeData(response.data.globeData);
      setGlobeAnalysis(response.data.analysis);
    } catch (error) {
      console.error('Globe data error:', error);
      setError('Failed to fetch globe data: ' + (error.response?.data?.error || error.message));
      setShowGlobe(false);
    }
  };

  const closeGlobeVisualization = () => {
    setShowGlobe(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col">
      <header className="bg-white shadow-md p-6">
        <h1 className="text-4xl font-bold text-center text-gray-800">App Idea Analyzer</h1>
      </header>
      <main className="flex-grow p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <motion.form
            onSubmit={handleSearch}
            className="mb-8 bg-white p-6 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter your app idea"
              className="w-full p-4 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500 text-lg"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-md hover:from-blue-600 hover:to-purple-700 transition duration-300 font-semibold text-lg"
            >
              Analyze App Idea
            </button>
          </motion.form>

          {isLoading && (
            <motion.div
              className="text-center my-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-gray-600 text-lg">Analyzing your app idea...</p>
              {/* Add a loading spinner here */}
            </motion.div>
          )}

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
            <>
              <motion.div
                className="mb-8 bg-white p-6 rounded-lg shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Analysis</h2>
              
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Summary</h3>
                  <p className="text-gray-800">{analysisText.summary}</p>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Existing Apps</h3>
                  <ul className="list-disc pl-5">
                    {analysisText.existingApps.map((app, index) => (
                      <li key={index} className="mb-2 text-gray-800">
                        <span className="font-semibold">{app.name}</span>: {app.description}
                        <br />
                        <span className="text-sm text-gray-700">
                          Market Share: {app.marketShare} | Revenue: {app.revenue}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Market Analysis</h3>
                  <p className="text-gray-800"><strong>Total Market Size:</strong> {analysisText.marketAnalysis.totalMarketSize}</p>
                  <p className="text-gray-800"><strong>Growth Rate:</strong> {analysisText.marketAnalysis.growthRate}</p>
                  <p className="text-gray-800"><strong>Key Players:</strong> {analysisText.marketAnalysis.keyPlayers.join(', ')}</p>
                  <p className="text-gray-800"><strong>Trends:</strong> {analysisText.marketAnalysis.trends.join(', ')}</p>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">User Demographics</h3>
                  <p className="text-gray-800"><strong>Age Groups:</strong> {analysisText.userDemographics.ageGroups.join(', ')}</p>
                  <p className="text-gray-800"><strong>Regions:</strong> {analysisText.userDemographics.regions.join(', ')}</p>
                  <p className="text-gray-800"><strong>Interests:</strong> {analysisText.userDemographics.interests.join(', ')}</p>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Monetization Strategies</h3>
                  <ul className="list-disc pl-5">
                    {analysisText.monetizationStrategies.map((strategy, index) => (
                      <li key={index} className="text-gray-800">{strategy}</li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Challenges</h3>
                  <ul className="list-disc pl-5">
                    {analysisText.challenges.map((challenge, index) => (
                      <li key={index} className="text-gray-800">{challenge}</li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Opportunities</h3>
                  <ul className="list-disc pl-5">
                    {analysisText.opportunities.map((opportunity, index) => (
                      <li key={index} className="text-gray-800">{opportunity}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </>
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
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <span className="text-gray-700">{search.query}</span>
                  </div>
                  <span className="text-gray-500 text-sm">{search.date}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SearchComponent;