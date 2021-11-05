import { useContext } from 'react';

import Header from '../components/Header';
import Footer from '../components/Footer';

import styles from '../styles/pages/Home.module.scss';

export default function Layout({ children }) {
  const hours = new Date().getHours();
  const isDayTime = hours > 7 && hours < 20;

  return (
    <div className={`relative w-full min-h-screen flex flex-col
      ${isDayTime ? styles.bgDay : styles.bgNight}`
    }>
      
      <Header />

      {children}

      <Footer />

    </div>
  )
}
