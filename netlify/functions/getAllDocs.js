// getAllDocs.js
import { supabaseAdmin } from '../../lib/supabaseClient';

export const handler = async (event, context) => {
  try {
    const { data: docs, error } = await supabaseAdmin
      .from('documents')
      .select('google_id, sharing_status, all_copy_ids, latest_copy_g_id, doc_type')
      .eq('doc_type', 'googleDocs');
      
    if (error) {
      console.error('Error fetching documents:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(docs),
    };
  } catch (error) {
    console.error('Error in getAllDocs function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};