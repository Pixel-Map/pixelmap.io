import {useContext, ReactNode} from 'react';

import Header from '../components/Header';
import Footer from '../components/Footer';

import styles from '../styles/pages/Home.module.scss';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({children}: LayoutProps) {
  const hours = new Date().getHours();

  // Is it a leap year?
  function isLeapYear(date) {
    const year = date.getFullYear();
    if ((year & 3) !== 0) return false;
    return ((year % 100) !== 0 || (year % 400) === 0);
  };

  // Get Day of Year
  function getDOY(date) {
    const dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const mn = date.getMonth();
    const dn = date.getDate();
    let dayOfYear = dayCount[mn] + dn;
    if (mn > 1 && isLeapYear(date)) dayOfYear++;
    return dayOfYear;
  };

  const todaysDay = getDOY(new Date())
  const isDayTime = hours >= 7 && hours < 20;

  function getBgClass(todaysDay) {
    // Winter
    if (todaysDay < 79) {
      return isDayTime ? styles.winterBgDay : styles.winterBgNight
    }
    // Spring
    if (todaysDay < 172) {
      return isDayTime ? styles.springBgDay : styles.springBgNight
    }
    // Summer
    if (todaysDay < 265) {
      return isDayTime ? styles.summerBgDay : styles.summerBgNight
    }
    // Fall
    if (todaysDay < 355) {
      return isDayTime ? styles.fallBgDay : styles.fallBgNight
    }
    // Winter Again
    return isDayTime ? styles.winterBgDay : styles.winterBgNight
  }

  return (
    <div className={`relative w-full min-h-screen flex flex-col
      ${getBgClass(todaysDay)}`
    }>

      <Header/>

      {children}

      <Footer/>

    </div>
  )
}
