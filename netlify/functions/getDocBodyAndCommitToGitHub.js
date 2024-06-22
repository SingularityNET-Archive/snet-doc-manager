// ../netlify/functions/getDocBodyAndCommitToGitHub.js
import { Octokit } from '@octokit/rest';
import { getDocumentText } from '../../utils/getDocumentText';

async function commitDocumentTextToGitHub(docs) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  for (const doc of docs) {
    const documentText = await getDocumentText(doc);
    const path = `Data/${doc.entity}/Content/${doc.workgroup}/Docs/GoogleDocs/${doc.google_id}/doc-text-only.md`;
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
    const { docs, recentChangesResponse, test } = JSON.parse(event.body);
    const docsToCommit = docs.filter(doc => recentChangesResponse.includes(doc.google_id));
    // Process each document
    if (!test) {
      // Process each document
      await commitDocumentTextToGitHub(docsToCommit);
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