import { useState } from "react";
import type { NextPage } from "next";
import styles from '../../styles/home.module.css';
import ProcessDocsButton from '../../components/ProcessDocsButton';
import GetNewDocs from '../../components/GetNewDocs';
import TestDocument from '../../components/TestDocument';
import ProcessUpdates from "../../components/ProcessUpdates";
import TestFeature from "../../components/TestFeature";

const DevTools: NextPage = () => {
    const [loading, setLoading] = useState<boolean>(false);

    return (
      <div className={styles.container}>
        {!loading && (
          <div>
            <div>
              <h1>Dev Tools</h1>
              <ProcessDocsButton />
              <br />
              <GetNewDocs />
              <br />
              <TestDocument />
              <br />
              <ProcessUpdates />
              <br />
              <TestFeature />
            </div>
          </div>
        )}
      </div>
    );
};

export default DevTools;
