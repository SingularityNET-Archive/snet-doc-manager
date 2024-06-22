// ../netlify/functions/getAllSummaryDocs.js
import { supabaseAdmin } from '../../lib/supabaseServerSideClient';

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
            const docInfo = { 
              doc_id: link, 
              workgroup: summary.workgroup.replace(/\s+/g, '-'),
              entity: 'Snet-Ambassador-Program',
              workingDoc: workingDoc 
            };
            if (domain.includes('docs.google.com')) {
              if (link.includes('/document/')) {
                acc.googleDocs.add(JSON.stringify(docInfo));
              } else if (link.includes('/spreadsheets/')) {
                acc.googleSpreadsheets.add(JSON.stringify(docInfo));
              }
            } else if (domain.includes('miro.com')) {
              acc.miroBoards.add(JSON.stringify(docInfo));
            } else if (domain.includes('medium.com')) {
              acc.mediumArticles.add(JSON.stringify(docInfo));
            } else if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
              acc.youTubeVideos.add(JSON.stringify(docInfo));
            } else {
              acc.others.add(JSON.stringify(docInfo));
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

    // Convert the Sets to arrays of objects before returning the response
    const uniqueCategorizedLinks = Object.entries(categorizedLinks).reduce((acc, [category, docInfoSet]) => {
      acc[category] = Array.from(docInfoSet).map(docInfoString => JSON.parse(docInfoString));
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