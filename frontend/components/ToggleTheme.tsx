import React from 'react'
import { ThemeSetting, ThemeType } from './ThemeContext';
import { Switch } from '@headlessui/react';

const ToggleTheme = ({ theme, toggleTheme }: ThemeType) => {
  const isOld = theme === ThemeSetting.OLD;

  const currentTime = new Date();

  return (
    <Switch
      checked={isOld}
      onChange={toggleTheme}
      className={`${
        isOld ? 'bg-green-600' : 'bg-gray-700'
      } relative inline-flex items-center h-8 rounded-full w-20`}
    >
      <span
        className={`${
          isOld ? 'translate-x-7' : 'translate-x-1'
        } inline-block w-12 h-7 transform bg-white rounded-full transition ease-in-out duration-200 text-xs text-gray-900 font-bold uppercase leading-7`}
      >
        { isOld &&
          <>2016</>
        }

        { !isOld &&
          <>{currentTime.getFullYear()}</>
        }
      </span>
    </Switch>
  )

};

export default ToggleTheme;