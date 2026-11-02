'use client';

import React, { useState, useMemo } from 'react';

// Definitions matching your existing DB records and Open Library payload fields
interface SavedBook {
  openlibrary_work_id: string; // e.g., 'OL27448W'
  title: string;
}

interface OpenLibraryDoc {
  key: string;               // e.g., '/works/OL27448W'
  title: string;
  author_name?: string[];
  first_publish_year?: number;
}

interface BookSelectorProps {
  /** Array of books pulled from your Supabase DB table on page load */
  initialSavedBooks: SavedBook[];
  /** Callback back to parent when a valid selection is confirmed */
  onBookSelect: (book: OpenLibraryDoc, isAlreadySaved: boolean) => void;
}

export default function BookSelector({ initialSavedBooks, onBookSelect }: BookSelectorProps) {

    console.log(initialSavedBooks);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenLibraryDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<OpenLibraryDoc | null>(null);

  // Quick lookup set for O(1) matching efficiency
  const savedIdSet = useMemo(() => {
    return new Set(initialSavedBooks.map((b) => b.openlibrary_work_id));
  }, [initialSavedBooks]);

  // Sort logic: Move items matching existing IDs to the top
  const prioritizedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const idA = a.key.replace('/works/', '');
      const idB = b.key.replace('/works/', '');
      const hasA = savedIdSet.has(idA) ? 1 : 0;
      const hasB = savedIdSet.has(idB) ? 1 : 0;
      return hasB - hasA; // Places matched items (1) before unmatched items (0)
    });
  }, [results, savedIdSet]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedBook(null);

    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&fields=key,title,author_name,author_key,first_publish_year`
      );
      if (!res.ok) throw new Error('Network response failure fetching Open Library API.');
      
      const data = await res.json();
      setResults(data.docs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (book: OpenLibraryDoc) => {
    const workId = book.key.replace('/works/', '');
    const isAlreadySaved = savedIdSet.has(workId);
    
    setSelectedBook(book);
    onBookSelect(book, isAlreadySaved);
  };

  return (
    <div className="w-full mx-auto p-4 bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="text-2xl">Add Your Entry</div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 px-4 py-2 text-base bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          placeholder="Search titles, authors, or topics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

      {/* Results Dropdown Pool */}
      {!selectedBook && prioritizedResults.length > 0 && (
        <div className="border border-slate-200 rounded-lg max-h-96 overflow-y-auto divide-y divide-slate-100 shadow-inner bg-slate-50">
          {prioritizedResults.map((book) => {
            const workId = book.key.replace('/works/', '');
            const isSaved = savedIdSet.has(workId);

            return (
              <div
                key={book.key}
                onClick={() => handleSelect(book)}
                className={`flex items-center gap-4 p-3 cursor-pointer transition-colors ${
                  isSaved ? 'bg-amber-50/60 hover:bg-amber-100/70' : 'bg-white hover:bg-slate-50'
                }`}
              >

                {/* Metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 truncate">{book.title}</span>
                    {isSaved && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                        Entered Previously
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {book.author_name ? book.author_name.join(', ') : 'Unknown Author'}
                    {book.first_publish_year ? ` • ${book.first_publish_year}` : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && query && results.length === 0 && !error && !selectedBook && (
        <p className="text-center py-6 text-slate-500">No books found matching "{query}"</p>
      )}

      {selectedBook && (
        <div className="mt-4 p-4 border-2 border-emerald-500 bg-emerald-50/30 rounded-xl flex gap-4 items-start relative">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{selectedBook.title}</h3>
            <p className="text-sm text-slate-700 mt-1">
              <strong className="text-slate-900">Author:</strong>{' '}
              {selectedBook.author_name ? selectedBook.author_name.join(', ') : 'Unknown'}
            </p>
            <p className="text-sm text-slate-700 mt-0.5">
              <strong className="text-slate-900">First Published:</strong>{' '}
              {selectedBook.first_publish_year || 'N/A'}
            </p>
            <p className="text-sm text-slate-500 mt-2 font-mono text-xs">
              ID: {selectedBook.key.replace('/works/', '')}
            </p>
            
            <button
              onClick={() => setSelectedBook(null)}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-md transition-colors"
            >
              Change Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
