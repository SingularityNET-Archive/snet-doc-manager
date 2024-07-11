// ../components/doc-manager/DocumentTable.tsx
import React, { useState, useEffect } from 'react';
import styles from '../../styles/docManager.module.css';

interface Document {
  google_id: string;
  title: string;
  workgroup: string;
  entity: string;
  sharing_status: string;
  url: string;
  doc_type: string;
  metadata: Record<string, any> | null;  // Allow null
  all_copy_ids: string[];
  latest_copy_g_id: string | null;
}

interface DocumentTableProps {
  documents: Document[];
  onActionClick: (doc: Document, rationale: string, docOwner: string) => Promise<void>;
}

const DocumentTable: React.FC<DocumentTableProps> = ({ documents, onActionClick }) => {
  const [rationales, setRationales] = useState<{ [key: string]: string }>({});
  const [docOwners, setDocOwners] = useState<{ [key: string]: string }>({});
  const [loadingDocuments, setLoadingDocuments] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Update docOwners state whenever documents change
    const updatedDocOwners = documents.reduce((acc, doc) => {
      acc[doc.google_id] = doc.metadata?.doc_owner || '';
      return acc;
    }, {} as { [key: string]: string });
    setDocOwners(prevOwners => ({
      ...prevOwners,
      ...updatedDocOwners
    }));
  }, [documents]);

  const handleRationaleChange = (docId: string, value: string) => {
    setRationales(prev => ({ ...prev, [docId]: value }));
  };

  const handleDocOwnerChange = (docId: string, value: string) => {
    setDocOwners(prev => ({ ...prev, [docId]: value }));
  };

  const handleArchiveClick = async (doc: Document) => {
    setLoadingDocuments(prev => ({ ...prev, [doc.google_id]: true }));
    try {
      // Update the metadata with the new doc_owner before calling onActionClick
      const updatedMetadata = {
        ...doc.metadata,
        doc_owner: docOwners[doc.google_id] || ''
      };
      const updatedDoc = {
        ...doc,
        metadata: updatedMetadata
      };
      
      await onActionClick(updatedDoc, rationales[doc.google_id] || '', docOwners[doc.google_id] || '');
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
          <th>Doc Owner</th>
          <th>Archive</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => {
          const initialDocOwner = doc.metadata?.doc_owner || '';
          
          return (
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
                <input
                  type="text"
                  value={docOwners[doc.google_id] || initialDocOwner}
                  onChange={(e) => handleDocOwnerChange(doc.google_id, e.target.value)}
                  placeholder="Enter doc owner"
                  disabled={loadingDocuments[doc.google_id]}
                />
              </td>
              <td>
                <button 
                  onClick={() => handleArchiveClick(doc)}
                  disabled={loadingDocuments[doc.google_id] || !rationales[doc.google_id] || !docOwners[doc.google_id]}
                >
                  {loadingDocuments[doc.google_id] ? 'Creating Archive...' : 'Create Archive Copy'}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default DocumentTable;