"use client";

import { QueryData } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { staticSupabase } from '@/lib/supabase/static';

export const ENTRIES_QUERY = `
  id,
  entered_for_book_club_event_id,
  book:books!book_id (
    id,
    title,
    link,
    author:authors!author_id (
        id,
        name
    )
  ),
  profile:profiles!profile_id (
      id,
      user_name
  ),
  selected_in_book_club_event:book_club_events!selected_in_book_club_event_id (
    id,
    scheduled_date
  )
` as const;

const baseQuery = staticSupabase.from('entries').select(ENTRIES_QUERY);
type RawEntryList = QueryData<typeof baseQuery>;

type Unpack<T> = T extends Array<infer U> ? U : T;

export type EntryItem = Omit<RawEntryList[number], 'book' | 'profile' | 'selected_in_book_club_event'> & {
  book: (Omit<Unpack<RawEntryList[number]['book']>, 'author'> & {
    author: Unpack<Unpack<RawEntryList[number]['book']>['author']> | null;
  }) | null;
  profile: Unpack<Unpack<RawEntryList[number]['profile']>> | null;
  selected_in_book_club_event: Unpack<Unpack<RawEntryList[number]['selected_in_book_club_event']>> | null;
};

export type EntryList = EntryItem[];

export async function getAllEntries() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('entries')
    .select(ENTRIES_QUERY);


  if (error) throw error;
  
  return data as unknown as EntryList;
}

export type NewEntry = {
  profileId: string,
  bookId: string,
  enteredForBookClubEventId: string,
};

export async function createEntry(newEntry: NewEntry) {
    const supabase = await createClient();

    await supabase
    .from("entries")
    .insert({ 
      profile_id: newEntry.profileId,
      book_id: newEntry.bookId,
      entered_for_book_club_event_id: newEntry.enteredForBookClubEventId,
    });
}