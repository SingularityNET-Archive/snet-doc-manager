// processDocs.js
import { supabaseAdmin } from '../../lib/supabaseClient';
import fetch from 'node-fetch';

const isTesting = false;
const callVars = isTesting
  ? { baseUrl: 'http://localhost:8888/.netlify/functions/', test: true }
  : { baseUrl: `${process.env.NETLIFY_FUNCTION_URL}/.netlify/functions/`, test: false };

const { baseUrl, test } = callVars;

export const handler = async (event, context) => {
  const { data: docs, error } = await supabaseAdmin
    .from('documents')
    .select('google_id, sharing_status');

  if (error) {
    console.error('Error fetching documents:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  const batchSize = 100; // Adjust the batch size as needed
  const batches = [];
  const statusChangeResponses = [];
  const commentsResponses = [];

  for (let i = 0; i < docs.length; i += batchSize) {
    batches.push(docs.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    try {
      const [statusChangeResponse, commentsResponse] = await Promise.all([
        fetch(`${baseUrl}checkStatusChanges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docs: batch, test: test }),
        }).then((res) => res.json()),
        fetch(`${baseUrl}getDocComments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docs: batch, test: test }),
        }).then((res) => res.json()),
      ]);

      statusChangeResponses.push(statusChangeResponse);
      commentsResponses.push(commentsResponse);
      console.log('Batch processed successfully');
    } catch (error) {
      console.error('Error processing batch:', error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Documents processed successfully',
      statusChangeResponses,
      commentsResponses,
    }),
  };
};