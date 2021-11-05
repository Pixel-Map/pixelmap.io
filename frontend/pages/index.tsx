import Head from 'next/head'

import Map from '../components/Map';
import { fetchTiles } from '../utils/api';
import Layout from "../components/Layout";

function Home({ tiles }) {

  return (
    <>
      <Layout>
        <Head>
          <title>PixelMap.io: Own a piece of Blockchain History!</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="py-8 md:py-12 lg:py-16">
          <Map tiles={tiles} />
        </main>
      </Layout>
    </>
  )
}

export async function getStaticProps() {
  const tiles = await fetchTiles();

  return {
    props: {
      tiles: tiles
    },
    revalidate: 60
  }

}

export default Home;
