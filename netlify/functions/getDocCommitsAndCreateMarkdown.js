// ../netlify/functions/getDocCommitsAndCreateMarkdown.js
import { Octokit } from '@octokit/rest';

async function getDocCommits(doc) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = 'SingularityNET-Archive';
  const repo = 'SingularityNET-Archive';
  const path = `Data/${doc.entity}/Content/${doc.workgroup}/Docs/GoogleDocs/${doc.google_id}/doc-text-only.md`;

  const { data: commits } = await octokit.repos.listCommits({
    owner,
    repo,
    path,
  });

  return commits;
}

function createMarkdownContent(doc, commits) {
  let markdownContent = `# Commit History for Document ${doc.google_id}\n\n`;
  markdownContent += `This file contains the commit history for the document with Google ID: ${doc.google_id}\n\n`;
  markdownContent += '## Commit Links\n\n';

  for (const commit of commits) {
    const commitUrl = commit.html_url;
    const commitDate = new Date(commit.commit.author.date).toLocaleDateString();
    markdownContent += `- [${commitDate}](${commitUrl})\n`;
  }

  return markdownContent;
}

async function commitMarkdownToGitHub(doc, markdownContent) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = 'SingularityNET-Archive';
  const repo = 'SingularityNET-Archive';
  const path = `Data/${doc.entity}/Content/${doc.workgroup}/Docs/GoogleDocs/${doc.google_id}/commit-history.md`;

  let currentSHA = null;
  try {
    const { data: currentFile } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });
    currentSHA = currentFile.sha;
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: `Update commit history for document ${doc.google_id}`,
    content: Buffer.from(markdownContent).toString('base64'),
    sha: currentSHA,
  });
}

export async function handler(event, context) {
  try {
    const doc = JSON.parse(event.body);

    const commits = await getDocCommits(doc);
    const markdownContent = createMarkdownContent(doc, commits);
    await commitMarkdownToGitHub(doc, markdownContent);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Commit history retrieved and markdown file committed successfully' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}