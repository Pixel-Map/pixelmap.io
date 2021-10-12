import React, { useEffect } from 'react'

export enum ThemeSetting {
  OLD = 1,
  NEW = 2
}

export type ThemeType = {
  theme: ThemeSetting
  toggleTheme:() => void
}

const initialState = {
  theme: ThemeSetting.OLD,
  toggleTheme: () => {}
}

const ThemeContext = React.createContext<ThemeType>(initialState)

function ThemeProvider({ children }) {
  const [theme, setTheme] = React.useState(ThemeSetting.OLD) // Default theme is old

  // On mount, read the preferred theme from the persistence
  useEffect(() => {
    const isOldTheme = localStorage.getItem('theme') === ThemeSetting.OLD.toString();
    setTheme(isOldTheme ? ThemeSetting.OLD : ThemeSetting.NEW);
  }, [theme])

  // To toggle between dark and light modes
  const toggleTheme = () => {
    const isOldTheme = theme === ThemeSetting.OLD;

    //switch theme setting
    localStorage.setItem('theme', JSON.stringify(isOldTheme ? ThemeSetting.NEW : ThemeSetting.OLD))
    setTheme(isOldTheme ? ThemeSetting.NEW : ThemeSetting.OLD);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export { ThemeProvider, ThemeContext }