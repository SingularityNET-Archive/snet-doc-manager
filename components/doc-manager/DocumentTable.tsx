import React, { useState } from 'react';
import styles from '../../styles/docManager.module.css';

interface Document {
  google_id: string;
  title: string;
  workgroup: string;
  entity: string;
  sharing_status: string;
  url: string;
  doc_type: string;
}

interface DocumentTableProps {
  documents: Document[];
  onActionClick: (doc: Document, rationale: string) => Promise<void>;
}

const DocumentTable: React.FC<DocumentTableProps> = ({ documents, onActionClick }) => {
  const [rationales, setRationales] = useState<{ [key: string]: string }>({});
  const [loadingDocuments, setLoadingDocuments] = useState<{ [key: string]: boolean }>({});

  const handleRationaleChange = (docId: string, value: string) => {
    setRationales(prev => ({ ...prev, [docId]: value }));
  };

  const handleArchiveClick = async (doc: Document) => {
    setLoadingDocuments(prev => ({ ...prev, [doc.google_id]: true }));
    try {
      await onActionClick(doc, rationales[doc.google_id] || '');
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [doc.google_id]: false }));
    }
  };

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Title</th>
          <th>Workgroup</th>
          <th>Entity</th>
          <th>Sharing Status</th>
          <th>Link</th>
          <th>Archives</th>
          <th>Rationale</th>
          <th>Archive</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => (
          <tr key={doc.google_id}>
            <td>{doc.title}</td>
            <td>{doc.workgroup}</td>
            <td>{doc.entity}</td>
            <td>{doc.sharing_status}</td>
            <td>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                Open
              </a>
            </td>
            <td>
              <a
                href={`https://github.com/SingularityNET-Archive/SingularityNET-Archive/tree/main/Data/${doc.entity}/Content/${doc.workgroup}/Docs/GoogleDocs/${doc.google_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                GitHub
              </a>
            </td>
            <td>
              <input
                type="text"
                value={rationales[doc.google_id] || ''}
                onChange={(e) => handleRationaleChange(doc.google_id, e.target.value)}
                placeholder="Enter rationale"
                disabled={loadingDocuments[doc.google_id]}
              />
            </td>
            <td>
              <button 
                onClick={() => handleArchiveClick(doc)}
                disabled={loadingDocuments[doc.google_id]}
              >
                {loadingDocuments[doc.google_id] ? 'Creating Archive...' : 'Create Archive Copy'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DocumentTable;