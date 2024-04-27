// processDocs.js
import fetch from 'node-fetch';

const isTesting = process.env.IS_TESTING === 'true';
const callVars = isTesting
  ? { baseUrl: 'http://localhost:8888/.netlify/functions/', test: true }
  : { baseUrl: `${process.env.NETLIFY_FUNCTION_URL}/.netlify/functions/`, test: false };

const { baseUrl, test } = callVars;

export const handler = async (event, context) => {
  const { docs } = JSON.parse(event.body);

  try {
    const [statusChangeResponse, commentsResponse] = await Promise.all([
      fetch(`${baseUrl}checkStatusChanges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: docs, test: test }),
      }).then((res) => res.json()),
      fetch(`${baseUrl}getDocComments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: docs, test: test }),
      }).then((res) => res.json()),
    ]);

    console.log('Documents processed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Documents processed successfully',
        statusChangeResponse,
        commentsResponse,
      }),
    };
  } catch (error) {
    console.error('Error processing documents:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};