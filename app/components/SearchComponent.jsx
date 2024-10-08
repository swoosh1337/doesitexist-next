'use client'

/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react';
import axios from 'axios';
import GlobeVisualization from './GlobeVisualization';

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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-md p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Check if your app idea already exists</h1>
      </header>
      <main className="flex-grow p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a project or describe an idea"
              className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-300 font-semibold"
            >
              Search
            </button>
          </form>
          {isLoading && (
            <div className="text-center my-4">
              <p className="text-gray-600">Analyzing results...</p>
              {/* You could add a spinner or loading animation here */}
            </div>
          )}
          {error && (
            <div className="text-red-500 mb-4 bg-red-100 p-4 rounded-md">{error}</div>
          )}
          {searchResults && searchResults.length > 0 && (
            <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Top 5 Search Results</h2>
              <ul>
                {searchResults.slice(0, 5).map((result, index) => (
                  <li key={index} className="mb-4">
                    <a 
                      href={result.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block hover:bg-gray-50 p-3 rounded transition duration-150"
                    >
                      <h3 className="font-semibold text-blue-600 hover:underline">
                        {result.title || 'No title available'}
                      </h3>
                      <p className="text-green-700 text-sm">{result.displayed_link || result.link || 'No link available'}</p>
                      <p className="text-gray-600 text-sm mt-1">{result.snippet || 'No description available'}</p>
                      <p className="text-gray-500 text-xs mt-1">Source: {result.source || 'Web'}</p>
                    </a>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={handleGlobeVisualization}
                className="mt-4 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Global Market Potential
              </button>
            </div>
          )}
          {analysisText && (
            <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Analysis</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{analysisText}</p>
            </div>
          )}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Your previous searches</h2>
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
          </div>
          {showGlobe && globeData && (
            <GlobeVisualization
              globeData={globeData}
              analysis={globeAnalysis}
              onClose={closeGlobeVisualization}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchComponent;