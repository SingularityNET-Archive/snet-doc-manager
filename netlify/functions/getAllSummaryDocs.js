// getAllSummaryDocs.js
import { supabaseAdmin } from '../../lib/supabaseClient';

export const handler = async (event, context) => {
  try {
    // Calculate the date 8 days ago
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    const { data: docs, error } = await supabaseAdmin
      .from('meetingsummaries')
      .select('summary, date, created_at, confirmed')
      .eq('confirmed', true)
      .gte('created_at', eightDaysAgo.toISOString());

    if (error) {
      console.error('Error fetching documents:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    // Extract and categorize the links from the workingDocs array
    const categorizedLinks = docs.reduce((acc, doc) => {
      const summary = doc.summary;
      if (summary.meetingInfo && summary.meetingInfo.workingDocs) {
        const workingDocs = summary.meetingInfo.workingDocs;
        if (Array.isArray(workingDocs)) {
          workingDocs.forEach(workingDoc => {
            const link = workingDoc.link.trim();
            const domain = new URL(link).hostname;
            if (domain.includes('docs.google.com')) {
              if (link.includes('/document/')) {
                acc.googleDocs.add(link);
              } else if (link.includes('/spreadsheets/')) {
                acc.googleSpreadsheets.add(link);
              }
            } else if (domain.includes('miro.com')) {
              acc.miroBoards.add(link);
            } else if (domain.includes('medium.com')) {
              acc.mediumArticles.add(link);
            } else if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
              acc.youTubeVideos.add(link);
            } else {
              acc.others.add(link);
            }
          });
        }
      }
      return acc;
    }, {
      googleDocs: new Set(),
      googleSpreadsheets: new Set(),
      miroBoards: new Set(),
      mediumArticles: new Set(),
      youTubeVideos: new Set(),
      others: new Set(),
    });

    // Convert the Sets to arrays before returning the response
    const uniqueCategorizedLinks = Object.entries(categorizedLinks).reduce((acc, [category, links]) => {
      acc[category] = Array.from(links);
      return acc;
    }, {});

    return {
      statusCode: 200,
      body: JSON.stringify(uniqueCategorizedLinks),
    };
  } catch (error) {
    console.error('Error in getAllDocs function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};