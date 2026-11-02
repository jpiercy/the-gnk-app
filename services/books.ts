
import { createClient } from '@/lib/supabase/client';

export interface SavedBook {
  openlibrary_work_id: string;
  title: string;
}

export type OpenLibraryBook = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  author_key?: string[];
};

export async function getBooks() {
    const supabase = await createClient();
    return await supabase.from('books').select('openlibrary_work_id, title');
}

export async function saveBookToDb(openLibraryBook: OpenLibraryBook) {
  const supabase = await createClient();
  const cleanWorkId = openLibraryBook.key.replace('/works/', '');
  const cleanAuthorId = openLibraryBook.author_key?.[0] || null;
  const authorName = openLibraryBook.author_name?.[0] || 'Unknown Author';

  let authorDbId = null;

  if (cleanAuthorId) {
    const { data: authorData, error: authorError } = await supabase
      .from('authors')
      .upsert(
        { name: authorName, openlibrary_author_id: cleanAuthorId },
        { onConflict: 'openlibrary_author_id' }
      )
      .select('id')
      .single();

    if (authorError) throw authorError;
    authorDbId = authorData.id;
  }

  const { data: bookData, error: bookError } = await supabase
    .from('books')
    .upsert(
      {
        title: openLibraryBook.title,
        author_id: authorDbId,
        openlibrary_work_id: cleanWorkId,
      },
      { onConflict: 'openlibrary_work_id' }
    )
    .select();

  if (bookError) throw bookError;
  return bookData;
}