import { useState, useEffect } from "react";
import type { NextPage } from "next";
import styles from '../styles/home.module.css';

const Home: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <div className={styles.container}>
      {!loading && (
        <div>
          <div>
            <h1>Snet Document Manager</h1>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
