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

function LiveEvent() {
  // const liveEvents = await getUpcomingEvents();

  const [liveEvent, setLiveEvent] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [tooManyEvents, setTooManyEvents] = useState(false);
  useEffect(() => {
    const fetchEntries = async () => {
      const liveEvents = await getUpcomingEvents();
      
      if (liveEvents) {
        if (liveEvents && liveEvents.length > 1) {
          setTooManyEvents(true);
        }
        setLiveEvent(liveEvents[0]);
      }
      setLoading(false);
    };

    fetchEntries();
  }, []);

  if (loading) return <div>Loading live events...</div>;
  if (tooManyEvents) return (<div>Contact your friendly GNKAdmin, the system has crapped its pants.</div>);
  // const liveEvent = liveEvents[0];
  return (
    <div>
      <div>{liveEvent.selected_from_entry?.book?.title || 'To be selected'} scheduled for {liveEvent.scheduled_date || 'idk, when you free?'}</div>
      <EntriesForEvent eventId={liveEvent.id}/>
    </div>
  );

  
  // const [data, setData] = useState<Entry[]>([]);
  // const [loading, setLoading] = useState(true);
  // useEffect(() => {
  //   const fetchEntries = async () => {
  //     const entries = await getAllEntries();
      
  //     if (entries) {
  //       setData(entries.map(mapResponseToViewModel));
  //     }
  //     setLoading(false);
  //   };

  //   fetchEntries();
  // }, []);

  // if (loading) return <div>Loading table data...</div>;
  // return <EntryTable data={data} />;
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
  return <EntryTable data={data} />;
}

interface EntriesForEventProps {
  eventId: string;
}

function EntriesForEvent({ eventId }: EntriesForEventProps) {
  const [filteredData, setFilteredData] = useState<Entry[]>([]);
  const [savedBooks, setSavedBooks] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [hasNotSubmittedAnEntry, setHasNotSubmittedAnEntry] = useState(false);
  const [loading, setLoading] = useState(true);

  
  const fetchData = async () => {
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || '';
      setUserId(currentUserId);

      const entries = await getAllEntries();
      const data = entries.map(mapResponseToViewModel);
      const filtered = data.filter(entry => entry.enteredForBookClubEventId === eventId);
      setFilteredData(filtered);

      const hasNotSubmitted = !filtered.some(entry => entry.profileId === currentUserId);
      setHasNotSubmittedAnEntry(hasNotSubmitted);

      const { data: books } = await supabase
        .from('books')
        .select('openlibrary_work_id, title');
      setSavedBooks(books || []);

    } catch (error) {
      console.error("Error fetching data for event entries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  if (loading) return <div>Loading entries for event...</div>;

  return (
    <div>
      {hasNotSubmittedAnEntry && (
        <EntryForm 
          initialSavedBooks={savedBooks} 
          profileId={userId} 
          eventId={eventId} 
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
      {/* <Suspense fallback=<p>Loading Upcoming Event...</p>>
        <LiveEvent />
      </Suspense> */}
      <div className="p-5"/>
      <p className="text-2xl">All Entries</p>
      <AllEntryTable/>
    </section>
  );
}