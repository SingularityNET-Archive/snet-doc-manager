// netlify/functions/getDocBodyAndCommitToGitHub.js
import { google } from 'googleapis';
import { Octokit } from '@octokit/rest';

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uris = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris
);
oauth2Client.setCredentials({ refresh_token: refreshToken });

async function getDocumentText(doc) {
  const docs = google.docs({ version: 'v1', auth: oauth2Client });
  try {
    const response = await docs.documents.get({
      documentId: doc.google_id,
    });
    const content = response.data.body.content;
    let docText = '';
    content.forEach((element) => {
      if (element.paragraph) {
        element.paragraph.elements.forEach((el) => {
          if (el.textRun && el.textRun.content) {
            docText += el.textRun.content;
          }
        });
      }
    });
    return docText;
  } catch (error) {
    if (error.code === 403) {
      console.warn('Access denied for document:', doc.google_id);
      return ''; // Return an empty string or any other default value you prefer
    } else {
      console.error('Error retrieving document text:', error);
      throw error; // Rethrow other errors
    }
  }
}

async function commitSummariesToGitHub(docs) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  for (const doc of docs) {
    const documentText = await getDocumentText(doc);
    const path = `Data/Docs/${doc.google_id}.txt`;

    let currentSHA = null;
    try {
      const { data: currentFile } = await octokit.repos.getContent({
        owner: "SingularityNET-Archive",
        repo: "SingularityNET-Archive",
        path,
      });
      currentSHA = currentFile.sha;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: "SingularityNET-Archive",
      repo: "SingularityNET-Archive",
      path,
      message: `Update document text for ${doc.google_id}`,
      content: Buffer.from(documentText).toString('base64'),
      sha: currentSHA,
    });
  }
}

export async function handler(event, context) {
  try {
    // Get the documents and test flag from the request body
    const { docs, statusChangeResponse, test } = JSON.parse(event.body);

    const docsToCommit = docs.filter(doc => statusChangeResponse.includes(doc.google_id));
    // Process each document
    if (!test) {
      // Process each document
      await commitSummariesToGitHub(docsToCommit);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Document text retrieved and committed successfully' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}