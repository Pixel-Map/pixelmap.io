import Head from "next/head";

import Layout from "../../components/Layout";
import TimelapsePlayer from "../../components/TimelapsePlayer";
import styles from "../../styles/pages/Timelapse.module.scss";

export default function TimelapsePage() {
  return (
    <Layout>
      <Head>
        <title>PixelMap Timelapse: 2021–2026 | PixelMap.io</title>
        <meta
          name="description"
          content="Watch PixelMap change from 2021 through 2026."
        />
      </Head>

      <main className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>
              PixelMap
              <br />
              <em>history.</em>
            </h1>
          </div>
          <div className={styles.heroStamp} aria-hidden="true">
            <span>PIXELMAP</span>
            <strong>21—26</strong>
            <small>UTC</small>
          </div>
        </header>

        <TimelapsePlayer />
      </main>
    </Layout>
  );
}
