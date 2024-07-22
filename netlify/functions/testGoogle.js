// ../netlify/functions/testGoogle.js
import { Octokit } from '@octokit/rest';
import { testDocument } from '../../utils/testDocument';

async function testGoogle(docs) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  for (const doc of docs) {
      const comments = await testDocument(doc);
      console.log('Comments:', comments);
  }
}
  
  export async function handler(event, context) {
    try {
      const { docs, test } = JSON.parse(event.body);
      if (!test) {
        await testGoogle(docs);
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Non-existing docs committed successfully' }),
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      };
    }
  }