// netlify/functions/getDocBodyAndCommentsAndCommitToGitHub.js
import { google } from 'googleapis';
import { Octokit } from '@octokit/rest';
import { getDocumentTextAndComments } from '../../utils/getDocumentTextAndComments';

async function commitDocumentTextAndCommentsToGitHub(docs) {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    for (const doc of docs) {
      const documentTextAndComments = await getDocumentTextAndComments(doc);
      console.log('Generated Markdown:', documentTextAndComments);
  
      // Check if the generated Markdown content includes comments
      if (documentTextAndComments.includes('> [Comments]')) {
        const path = `Data/${doc.entity}/Content/${doc.workgroup}/Docs/GoogleDocs/${doc.google_id}/doc-with-comments.md`;
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
          message: `Update document text and comments for ${doc.google_id}`,
          content: Buffer.from(documentTextAndComments).toString('base64'),
          sha: currentSHA,
        });
      } else {
        console.log(`No comments found for document ${doc.google_id}. Skipping commit.`);
      }
    }
  }

export async function handler(event, context) {
  try {
    // Get the documents and test flag from the request body
    const { docs, recentChangesResponse, test } = JSON.parse(event.body);
    const docsToCommit = docs.filter(doc => recentChangesResponse.includes(doc.google_id));
    // Process each document
    if (!test) {
      // Process each document
      await commitDocumentTextAndCommentsToGitHub(docsToCommit);
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Document text and comments retrieved and committed successfully' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}