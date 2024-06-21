// components/doc-manager/DocumentTable.tsx
import React from 'react';
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
  onActionClick: (doc: Document) => void;
}

const DocumentTable: React.FC<DocumentTableProps> = ({ documents, onActionClick }) => {
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
          <th>Action</th>
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
              <button onClick={() => onActionClick(doc)}>Action</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DocumentTable;