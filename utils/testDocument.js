// utils/testDocument.js
// This file contains the code for testing the document comments.
import { google } from 'googleapis';
import { getOAuth2Client } from '../utils/oauth2Client';
import { sendErrorMessageToDiscord } from '../utils/discordWebhook';

const oauth2Client = getOAuth2Client();

export async function testDocument(doc) {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    try {
      const commentsResponse = await drive.comments.list({
        fileId: doc.google_id,
        fields: 'comments(id,author,content,quotedFileContent,anchor,replies(author,content))',
      });
  
      const commentsData = commentsResponse.data.comments;
  
      console.log('Document ID:', doc.google_id);
      console.log('Comments Data:', commentsData);
  
      let commentsText = '';
  
      commentsData.forEach((comment) => {
        const resolvedReply = comment.replies.find((reply) => reply.content === '');
        const isResolved = resolvedReply !== undefined;
  
        if (comment.quotedFileContent) {
          commentsText += `#### Context - ${comment.quotedFileContent.value}\n`;
        }
  
        commentsText += `> * ${comment.author.displayName}: ${comment.content}`;
  
        if (isResolved) {
          commentsText += ` (Resolved by ${resolvedReply.author.displayName})\n`;
        } else {
          commentsText += '\n';
        }

        comment.replies.forEach((reply) => {
            if (reply.content !== '') {
              commentsText += `>   - ${reply.author.displayName}: ${reply.content}\n`;
            }
          });
  
        commentsText += '> \n';
      });
  
      return commentsText;
    } catch (error) {
      if (error.code === 403) {
        console.warn('Access denied for document:', doc.google_id);
        await sendErrorMessageToDiscord(`Access denied for document: ${doc.google_id}`);
        return true;
      } else if (error.code === 404) {
        console.warn('File not found:', doc.google_id);
        await sendErrorMessageToDiscord(`File not found: ${doc.google_id}`);
        return true;
      } else if (error.code === 401 && error.message.includes('invalid_grant')) {
        console.error('Refresh token expired. Please obtain a new refresh token.');
        await sendErrorMessageToDiscord('Google Refresh Token Expired. Please obtain a new refresh token.');
        throw error;
      } else {
        console.error('Failed to retrieve document comments:', error);
        await sendErrorMessageToDiscord(`Failed to retrieve document comments ${doc.google_id}: ${error.message}`);
        throw error;
      }
    }
  }