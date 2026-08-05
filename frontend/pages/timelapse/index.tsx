import Head from "next/head";

import Layout from "../../components/Layout";
import TimelapsePlayer from "../../components/TimelapsePlayer";
import styles from "../../styles/pages/Timelapse.module.scss";

export default function TimelapsePage() {
  return (
    <Layout>
      <Head>
        <title>PixelMap Timelapse: 2023–2026 | PixelMap.io</title>
        <meta
          name="description"
          content="Watch every visible PixelMap tile change from 2023 through 2026, reconstructed from the on-chain archive."
        />
      </Head>

      <main className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>A LIVING ARTIFACT · ETHEREUM BLOCK BY BLOCK</span>
            <h1>
              Four years.
              <br />
              One living <em>map.</em>
            </h1>
            <p>
              Watch PixelMap evolve from 2023 through 2026—one owner, one tile,
              and one on-chain pixel change at a time.
            </p>
          </div>
          <div className={styles.heroStamp} aria-hidden="true">
            <span>ARCHIVE</span>
            <strong>23—26</strong>
            <small>FULL MAP / LIVE DATA</small>
          </div>
        </header>

        <TimelapsePlayer />

        <section className={styles.explainer}>
          <span>HOW THIS WORKS</span>
          <p>
            This is not a simulation or a folder of screenshots. PixelMap keeps
            each tile&apos;s image history with its Ethereum block and timestamp. The
            player rebuilds the full 1,296 × 784 map at the start of 2023, then
            applies every visible image change in chain order through 2026.
          </p>
        </section>
      </main>
    </Layout>
  );
}
