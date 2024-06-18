import { useState } from "react";
import type { NextPage } from "next";
import styles from '../../styles/home.module.css';

const DocManager: NextPage = () => {
  const [loading, setLoading] = useState(false);

  async function getDocuments() {
    const response = await fetch('/.netlify/functions/getAllDocs');
    const data = await response.json();
  }

  return (
    <div className={styles.container}>
        <div>
            <h1>Snet Document Manager</h1>
        </div>
    </div>
  );
};

export default DocManager;
