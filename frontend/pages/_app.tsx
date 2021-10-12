import React, { useState } from 'react';

import { Web3ReactProvider } from '@web3-react/core';
import { ThemeProvider } from '../components/ThemeContext';

import getLibrary from '../utils/getLibrary';
import Layout from '../components/Layout'

import '../styles/globals.css'

function App({ Component, pageProps }) {

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <ThemeProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </Web3ReactProvider>
  )
}

export default App
