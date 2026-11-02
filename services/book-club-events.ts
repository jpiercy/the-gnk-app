import { QueryData } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { staticSupabase } from '@/lib/supabase/static';

export const EVENT_DETAILS_QUERY = `
  id,
  scheduled_date,
  occurred_date,
  accepting_entries,
  selected_from_entry:entries!selected_from_entry_id (
    id,
    profile:profiles!profile_id (
        id,
        user_name
    ),
    book:books!book_id (
        id,
        title,
        link,
        author:authors!author_id (
            id,
            name
        )
    )
  )
` as const;

// 1. Get the raw inferred query structure from your static client reference
const baseQuery = staticSupabase.from('book_club_events').select(EVENT_DETAILS_QUERY);
type RawEventList = QueryData<typeof baseQuery>;

// 2. A clean, generic type helper to strip arrays from your 1:1 nested targets
type Unpack<T> = T extends Array<infer U> ? U : T;

// 3. Export your clean types for your other Next.js components to use
export type EventDetailsItem = Omit<RawEventList[number], 'selected_from_entry'> & {
  selected_from_entry: (Omit<Unpack<RawEventList[number]['selected_from_entry']>, 'profile' | 'book'> & {
    profile: Unpack<Unpack<RawEventList[number]['selected_from_entry']>['profile']> | null;
    book: (Omit<Unpack<Unpack<RawEventList[number]['selected_from_entry']>['book']>, 'author'> & {
      author: Unpack<Unpack<Unpack<RawEventList[number]['selected_from_entry']>['book']>['author']> | null;
    }) | null;
  }) | null;
};

export type EventDetailsList = EventDetailsItem[];

/**
 * 4. Production fetch function (Safe for fluid compute inside Server Functions)
 */
export async function getUpcomingEvents() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('book_club_events')
    .select(EVENT_DETAILS_QUERY)
    .is('occurred_date', null);


  if (error) throw error;
  
  // Cast the output directly to your formatted single-object type definition
  return data as unknown as EventDetailsList;
}

export async function createBookClubEvent(formData: FormData) {
    const supabase = await createClient();
    let scheduledDate = formData.get("scheduledDate") as string;
    if (scheduledDate) {
        scheduledDate = new Date(scheduledDate).toISOString();
    }

    await supabase.from("bookClubEvents").insert({ scheduledDate });
}