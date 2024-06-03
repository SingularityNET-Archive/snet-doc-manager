import { useState } from "react";
import type { NextPage } from "next";
import styles from '../styles/home.module.css';
import ProcessDocsButton from '../components/ProcessDocsButton';
import GetNewDocs from '../components/GetNewDocs';
import TestDocument from '../components/TestDocument';
import ProcessUpdates from "../components/ProcessUpdates";

const Home: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <div className={styles.container}>
      {!loading && (
        <div>
          <div>
            <h1>Snet Document Manager</h1>
            <ProcessDocsButton />
            <br />
            <GetNewDocs />
            <br />
            <TestDocument />
            <br />
            <ProcessUpdates />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;