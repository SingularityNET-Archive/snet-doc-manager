// utils/getDocumentText.js
import { google } from 'googleapis';
import { getOAuth2Client } from '../utils/oauth2Client';
import { sendErrorMessageToDiscord } from '../utils/discordWebhook';

const oauth2Client = getOAuth2Client();

export async function getDocumentText(doc) {
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    try {
      const response = await docs.documents.get({
        documentId: doc.google_id,
      });
      const content = response.data.body.content;
      let docText = '';
      let isTitleFound = false;
      content.forEach((element) => {
        if (element.paragraph) {
          let headingLevel = 0;
          if (element.paragraph.paragraphStyle && element.paragraph.paragraphStyle.namedStyleType) {
            const styleType = element.paragraph.paragraphStyle.namedStyleType;
            if (styleType === 'TITLE' && !isTitleFound) {
              headingLevel = 1;
              isTitleFound = true;
            } else if (styleType === 'HEADING_1') {
              headingLevel = 1;
            } else if (styleType === 'HEADING_2') {
              headingLevel = 2;
            } else if (styleType === 'HEADING_3') {
              headingLevel = 3;
            } else if (styleType === 'HEADING_4') {
              headingLevel = 4;
            } else if (styleType === 'HEADING_5') {
              headingLevel = 5;
            } else if (styleType === 'HEADING_6') {
              headingLevel = 6;
            }
          }
          let paragraphText = '';
          let isBold = false;
          element.paragraph.elements.forEach((el) => {
            if (el.textRun && el.textRun.content) {
              const text = el.textRun.content.replace(/\n/g, '').trim();
              const style = el.textRun.textStyle;
              if (style && style.bold && headingLevel === 0) {
                if (!isBold) {
                  paragraphText += '**';
                  isBold = true;
                }
                paragraphText += text;
                if (text.endsWith(' ')) {
                  paragraphText += '** ';
                  isBold = false;
                }
              } else {
                if (isBold) {
                  paragraphText += '** ';
                  isBold = false;
                }
                paragraphText += text + ' ';
              }
            }
          });
          if (isBold) {
            paragraphText += '**';
          }
          if (headingLevel > 0 && paragraphText.trim() !== '') {
            docText += `${'#'.repeat(headingLevel)} ${paragraphText.trim()}\n`;
          } else {
            docText += paragraphText.trim() + '\n';
          }
          docText += '\n';
        }
      });
      return docText;
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
        console.error('Failed to retrieve document text:', error);
        await sendErrorMessageToDiscord(`Failed to retrieve document text ${doc.google_id}: ${error.message}`);
        throw error;
      }
    }
  }