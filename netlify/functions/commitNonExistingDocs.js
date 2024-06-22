// ../netlify/functions/commitNonExistingDocs.js
import { Octokit } from '@octokit/rest';
import { getDocumentText } from '../../utils/getDocumentText';

async function commitNonExistingDocsToGitHub(docs) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  for (const doc of docs) {
    const existingFileNames = new Set();
    const path = `Data/${doc.entity}/Content/${doc.workgroup}/Docs/GoogleDocs/${doc.google_id}`;

    try {
      const { data: existingFiles } = await octokit.repos.getContent({
        owner: "SingularityNET-Archive",
        repo: "SingularityNET-Archive",
        path,
      });
      existingFiles.forEach((file) => {
        const fileName = file.name.replace(".md", "");
        existingFileNames.add(fileName);
      });
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }

    if (!existingFileNames.has("doc-text-only")) {
      const documentText = await getDocumentText(doc);
      await octokit.repos.createOrUpdateFileContents({
        owner: "SingularityNET-Archive",
        repo: "SingularityNET-Archive",
        path: `${path}/doc-text-only.md`,
        message: `Add document text for ${doc.google_id}`,
        content: Buffer.from(documentText).toString('base64'),
      });
    }
  }
}
  
  export async function handler(event, context) {
    try {
      const { docs, test } = JSON.parse(event.body);
      if (!test) {
        await commitNonExistingDocsToGitHub(docs);
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