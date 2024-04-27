// netlify/functions/testDocProccessing.js
import fetch from 'node-fetch';

export const handler = async (event, context) => {
  try {
    // Make a call to your getAllDocs Netlify function
    const response = await fetch(`http://localhost:8888/.netlify/functions/getAllDocs`);
    const data = await response.json();

    // Check if the response is valid
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid response from getAllDocs function');
    }

    const docs = data;

    // Break documents into batches
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < docs.length; i += batchSize) {
      batches.push(docs.slice(i, i + batchSize));
    }

    // Process each batch by calling your processDocs Netlify function
    const processedResults = [];
    for (const batch of batches) {
      const response = await fetch(`http://localhost:8888/.netlify/functions/processDocs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ docs: batch, test: false }),
      });

      const result = await response.json();
      processedResults.push(result);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(processedResults),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};