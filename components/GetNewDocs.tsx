// components/GetNewDocs.tsx
import { useState } from 'react';

const GetNewDocs = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);

      // Make a call to your getAllSummaryDocs Netlify function
      const response = await fetch('/.netlify/functions/getAllSummaryDocs');
      const categorizedLinks = await response.json();
      console.log("docs", categorizedLinks);
/*
      // Make a call to your uploadDocs Netlify function
      const uploadResponse = await fetch('/.netlify/functions/uploadDocs', {
        method: 'POST',
        body: JSON.stringify(categorizedLinks),
      });
      const uploadData = await uploadResponse.json();
      console.log("Upload response:", uploadData);

      // Make a call to your getAllSummaryDocs Netlify function
      const result = await fetch('/.netlify/functions/updateDocTitles');
      console.log("result.json()", result.json());
*/
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Processing...' : 'Get and Upload Summary Docs'}
    </button>
  );
};

export default GetNewDocs;