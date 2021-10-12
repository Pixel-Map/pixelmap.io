const colors = require('tailwindcss/colors');

module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      'sans': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
    },
    extend: {
      colors: {
        green: colors.green
      },
      width: {
        'map': '1296px',
        'md': '28rem',
        42: '9.75rem'
      },
      maxWidth: {
        'map': '1296px',
      },
      height: {
        'map': '784px',
        42: '9.75rem'
      },
      gridTemplateColumns: {
        'map': 'repeat(81, 16px)',
      },
      gridTemplateRows: {
        'map': 'repeat(49, 16px)',
      }
    },
  },
  variants: {
    extend: {
      ringWidth: ['hover', 'active']
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
