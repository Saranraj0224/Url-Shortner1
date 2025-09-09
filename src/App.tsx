import React, { useState, useEffect } from 'react';
import { Link, Copy, ExternalLink, Trash2 } from 'lucide-react';

interface ShortenedUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title: string;
  clicks: number;
  createdAt: string;
}

function App() {
  const [inputUrl, setInputUrl] = useState('');
  const [shortenedUrls, setShortenedUrls] = useState<ShortenedUrl[]>([]);
  const [recentUrl, setRecentUrl] = useState<ShortenedUrl | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Load URLs from localStorage on component mount
  useEffect(() => {
    const savedUrls = localStorage.getItem('shortenedUrls');
    if (savedUrls) {
      setShortenedUrls(JSON.parse(savedUrls));
    }
  }, []);

  // Save URLs to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem('shortenedUrls', JSON.stringify(shortenedUrls));
  }, [shortenedUrls]);

  const generateShortCode = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const extractTitle = async (url: string): Promise<string> => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'Unknown';
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleShortenUrl = async () => {
    if (!inputUrl.trim()) return;
    
    if (!validateUrl(inputUrl)) {
      alert('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call backend API to create short URL
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: inputUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create short URL');
      }

      const data = await response.json();
      
      const newUrl: ShortenedUrl = {
        id: Date.now().toString(),
        originalUrl: data.originalUrl,
        shortCode: data.shortCode,
        shortUrl: data.shortUrl,
        title: data.title,
        clicks: data.clicks,
        createdAt: new Date().toISOString()
      };

      setShortenedUrls(prev => [newUrl, ...prev]);
      setRecentUrl(newUrl);
      setInputUrl('');
    } catch (error) {
      console.error('Error creating short URL:', error);
      alert('Error creating short URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(text);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyFeedback(text);
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  const handleExternalLink = (url: string, shortCode: string) => {
    // Update clicks locally
    updateClicks(shortCode);
    
    window.open(url, '_blank');
  };

  const updateClicks = (shortCode: string) => {
    setShortenedUrls(prev =>
      prev.map(item =>
        item.shortCode === shortCode
          ? { ...item, clicks: item.clicks + 1 }
          : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setShortenedUrls(prev => prev.filter(item => item.id !== id));
    if (recentUrl && recentUrl.id === id) {
      setRecentUrl(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleShortenUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Link className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Too-Short</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Main URL Shortener Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Shorten Your <span className="text-blue-500">Long URLs</span>
            </h2>
            <p className="text-gray-600">
              Transform lengthy URLs into clean, shareable links in seconds
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Link className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your long URL here..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <p className="text-sm text-gray-500">
              Short code will be generated automatically.
            </p>

            <button
              onClick={handleShortenUrl}
              disabled={!inputUrl.trim() || isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Shortening URL...</span>
                </div>
              ) : (
                'Shorten URL'
              )}
            </button>
          </div>
        </div>

        {/* Success Message & Result */}
        {recentUrl && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-fadeIn">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600 text-sm font-medium">URL shortened successfully!</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short URL
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <a
                      href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redirect/${recentUrl.short_code}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleExternalLink(recentUrl.original_url, recentUrl.short_code);
                      }}
                      className="text-blue-500 hover:text-blue-600 font-mono text-lg transition-colors duration-200"
                    >
                      {recentUrl.shortUrl}
                    </a>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleCopy(recentUrl.shortUrl)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all duration-200"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExternalLink(recentUrl.originalUrl, recentUrl.shortCode)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all duration-200"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(recentUrl.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Original URL</div>
                  <div className="text-gray-900 break-all">{recentUrl.originalUrl}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Title</div>
                  <div className="text-sm text-gray-900">{recentUrl.title}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Clicks</div>
                  <div className="text-sm text-gray-900">{recentUrl.clicks}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Copy Feedback */}
        {copyFeedback && (
          <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slideIn z-50">
            Copied to clipboard!
          </div>
        )}
      </main>
    </div>
  );
}

export default App;