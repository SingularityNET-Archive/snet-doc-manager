// fetchAllDocs.js
import { supabaseAdmin } from '../../lib/supabaseClient';

export const handler = async (event, context) => {
  const { data: docs, error } = await supabaseAdmin
    .from('documents')
    .select('google_id, sharing_status'); 

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  // No longer just mapping to google_id; return the full objects
  return { statusCode: 200, body: JSON.stringify(docs) };
};
