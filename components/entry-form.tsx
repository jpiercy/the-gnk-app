'use client';

import { saveBookToDb, SavedBook, OpenLibraryBook } from '@/services/books';
import { useState } from 'react';
import BookSelector from './book-selector';
import { createEntry } from '@/services/entries';


export default function EntryForm({ initialSavedBooks, profileId, eventId, onSave }: { initialSavedBooks: SavedBook[], profileId: string, eventId: string, onSave: () => {} }) {
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>(initialSavedBooks);
  const [selectedSelection, setSelectedSelection] = useState<OpenLibraryBook | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBookSelection = (book: OpenLibraryBook, isAlreadySaved: boolean) => {
    setSelectedSelection(book);
    setIsDuplicate(isAlreadySaved);
    setStatusMessage(null);
  };

  const handleSave = async () => {
    if (!selectedSelection) return;
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const savedBook = await saveBookToDb(selectedSelection);
      const newWorkId = selectedSelection.key.replace('/works/', '');
      
      setSavedBooks((prev) => [...prev, { openlibrary_work_id: newWorkId, title: selectedSelection.title }]);
      setIsDuplicate(true);
      setStatusMessage({ type: 'success', text: 'Thank you for your entry!' });

      createEntry({bookId: savedBook[0].id, profileId: profileId, enteredForBookClubEventId: eventId})
      onSave();
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Database submission failed. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <BookSelector 
        initialSavedBooks={savedBooks} 
        onBookSelect={handleBookSelection} 
      />

      {statusMessage && (
        <div className={`p-4 rounded-lg text-sm font-medium border ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {selectedSelection && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Selection</p>
            <h4 className="font-semibold text-slate-900 truncate mt-0.5">{selectedSelection.title}</h4>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className='px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
          >
            {isSaving && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isSaving ? 'Submitting...' : 'Submit Entry!'}
          </button>
        </div>
      )}
    </div>
  );
}
