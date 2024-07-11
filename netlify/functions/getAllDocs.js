// ../netlify/functions/getAllDocs.js
import { supabaseAdmin } from '../../lib/supabaseServerSideClient';

export const handler = async (event, context) => {
  try {
    const { data: docs, error } = await supabaseAdmin
      .from('documents')
      .select('google_id, sharing_status, all_copy_ids, latest_copy_g_id, doc_type, workgroup, entity, title, url, metadata')
      .eq('doc_type', 'googleDocs');

    if (error) {
      console.error('Error fetching documents:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    // Filter out duplicate documents based on google_id
    const uniqueDocs = Object.values(
      docs.reduce((acc, doc) => {
        if (!acc[doc.google_id]) {
          acc[doc.google_id] = doc;
        }
        return acc;
      }, {})
    );

    return {
      statusCode: 200,
      body: JSON.stringify(uniqueDocs),
    };
  } catch (error) {
    console.error('Error in getAllDocs function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};