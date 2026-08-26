/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.js', './config.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI Variable Display"', '"Segoe UI"',
               'system-ui', '-apple-system', '"Helvetica Neue"', 'Arial', 'sans-serif']
      },
      colors: {
        wap: '#FFB400', amber: '#FFB023', waaw: '#D7FF1A'
      }
    }
  },
  // classes montadas dentro de template strings que o scanner pode nao pegar
  safelist: ['t-done','t-sched','t-pend','t-late','t-neutral',
             'c-done','c-sched','c-pend','c-self','c-me',
             'av-dir','av-head','av-ger','btn-primary'],
  plugins: []
};
