"use client";

// import { getUpcomingEvents } from "./_queries/queries";
import { EntryTable, Entry } from "@/components/entry-table";
import { EventDetailsItem, getUpcomingEvents } from "@/services/book-club-events";
import { EntryItem, EntryList, getAllEntries } from "@/services/entries";
import { Suspense, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
// import { getBooks, OpenLibraryBook, saveBookToDb, SavedBook } from "@/services/books";
// import BookSelector from "@/components/book-selector";
import EntryForm from "@/components/entry-form";
import { Database } from '@/types/supabase';
import { assignEntryForEvent } from '@/services/entries';

type ActiveEntryRow = Database['public']['Views']['active_entries']['Row'];

function LiveEvent() {
  const [liveEvent, setLiveEvent] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [tooManyEvents, setTooManyEvents] = useState(false);

  const fetchLiveEvent = async () => {
    const liveEvents = await getUpcomingEvents();

    if (liveEvents) {
      if (liveEvents.length > 1) {
        setTooManyEvents(true);
      }
      setLiveEvent(liveEvents[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveEvent();
  }, []);

  if (loading) return <div>Loading live events...</div>;
  if (tooManyEvents) return (<div>Contact your friendly GNKAdmin, the system has crapped its pants.</div>);
  // const liveEvent = liveEvents[0];
  return (
    <div>
      <div>
        <span className="italic font-bold">{liveEvent.selected_from_entry?.book?.title || 'To be selected'}</span>
        <span> scheduled for {liveEvent.scheduled_date || 'idk, when you free?'}</span>
      </div>
      <EntriesForEvent event={liveEvent} onEventUpdated={fetchLiveEvent}/>
    </div>
  );
}

const mapResponseToViewModel = (source: EntryItem): Entry => {
  return {
    id: source.id,//.toString(),
    user: source.profile?.user_name || '',
    bookTitle: source.book?.title || '',
    author: source.book?.author?.name || '',
    selected: source.selected_in_book_club_event ? true : false,
    enteredForBookClubEventId: source.entered_for_book_club_event_id || '',
    profileId: source.profile?.id || ''
  };
};

// async function getEntries(): Promise<Entry[]> {
//   /*
//   type Entry = {
//   id: string
//   user: string
//   bookTitle: string
//   author: string
//   selected: boolean
  // enteredForBookClubEventId: string
  // profileId: string
// }
function AllEntryTable() {
  const [data, setData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchEntries = async () => {
      const entries = await getAllEntries();
      
      if (entries) {
        setData(entries.map(mapResponseToViewModel));
      }
      setLoading(false);
    };

    fetchEntries();
  }, []);

  if (loading) return <div>Loading table data...</div>;
  return <EntryTable data={data} paginationProp={true} />;
}

interface EntriesForEventProps {
  event: EventDetailsItem;
  onEventUpdated: () => Promise<void>;
}

function EntriesForEvent({ event, onEventUpdated }: EntriesForEventProps) {
  const [filteredData, setFilteredData] = useState<Entry[]>([]);
  const [savedBooks, setSavedBooks] = useState<any[]>([]);
  const [activeEntries, setActiveEntries] = useState<ActiveEntryRow[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [hasNotSubmittedAnEntry, setHasNotSubmittedAnEntry] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ActiveEntryRow | null>();

  const handleBookSelection = () => {
    console.log(activeEntries);
    const i = Math.floor(Math.random() * (activeEntries.length));
    setSelectedEntry(activeEntries[i]);
    console.log(selectedEntry);
  };

  
  const fetchData = async () => {
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || '';
      setUserId(currentUserId);

      const entries = await getAllEntries();
      const data = entries.map(mapResponseToViewModel);
      const filtered = data.filter(entry => entry.enteredForBookClubEventId === event.id);
      setFilteredData(filtered);

      const hasNotSubmitted = !filtered.some(entry => entry.profileId === currentUserId);
      setHasNotSubmittedAnEntry(hasNotSubmitted);

      const { data: books } = await supabase
        .from('books')
        .select('openlibrary_work_id, title');
      setSavedBooks(books || []);
        
      const { data: retrievedActiveEntries } = await supabase
        .from('active_entries')
        .select('entry_id, entered_for_book_club_event_id, book_id, book_title, profile_id, user_name, author_id, author_name');
      setActiveEntries(retrievedActiveEntries || []);

    } catch (error) {
      console.error("Error fetching data for event entries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (event) {
      fetchData();
    }
  }, [event]);

  const saveSelectedEntryForEvent = async () => {
    if (selectedEntry?.entry_id && selectedEntry?.book_id && event.id) {
      await assignEntryForEvent({entryId: selectedEntry.entry_id, eventId: event.id, bookId: selectedEntry.book_id})
      // fetchData();
      setSelectedEntry(null);
      await onEventUpdated(); 
    } else {
      console.log('Error trying to save an entry selection without an active event id or a selected entry id.')
    }
  }

  const denialText = (): string => {
    if (selectedEntry?.profile_id == '40f3b2fd-c9f7-4443-b444-963e226e0016') {
      return 'HE CAN\'T KEEP GETTING AWAY WITH THIS';
    } else {
      return 'I\'m jokin';
    }
  }

  if (loading) return <div>Loading entries for event...</div>;

  return (
    <div>
      {event.selected_from_entry ? null : (
        <div>
          <button onClick={handleBookSelection} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm">WHAT'LL IT BE</button>
          {selectedEntry ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="italic font-bold">{selectedEntry?.book_title}</span>
                <span> written by </span>
                <span className="font-bold">{selectedEntry?.author_name}</span>
                <span> entered by </span>
                <span className="font-bold">{selectedEntry?.user_name}</span>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={saveSelectedEntryForEvent}
                  className="px-5 py-2 bg-green-200 hover:bg-green-300 text-white font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                >
                  It is decided
                </button>
                <button
                  onClick={handleBookSelection}
                  className="px-5 py-2 bg-red-200 hover:bg-red-300 text-white font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                >
                  {denialText()}
                </button>
              </div>
            </div>
          ) : null}
            </div>
          )}
      {hasNotSubmittedAnEntry && event.accepting_entries && (
        <EntryForm 
          initialSavedBooks={savedBooks} 
          profileId={userId} 
          eventId={event.id} 
          onSave={fetchData}
        />
      )}
      <EntryTable data={filteredData} paginationProp={false}/>
    </div>
  );
}

export default function BookClub() {
  return (
    <section>
      <p id="list-title" className="text-2xl">Upcoming Event</p>
      <LiveEvent />
      <div className="p-5"/>
      <p className="text-2xl">All Entries</p>
      <AllEntryTable/>
    </section>
  );
}