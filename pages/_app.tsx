import '../styles/globals.css'
// import 'highlight.js/styles/default.css';
import 'highlight.js/styles/dark.css';
import type { AppProps } from 'next/app'
import { createTheme, ThemeProvider } from '@mui/material'

const muiTheme = createTheme({palette: {mode:'dark', primary: {main: '#B5AFD0'}}})

function MyApp({ Component, pageProps }: AppProps) {
  return <ThemeProvider theme={muiTheme}><Component {...pageProps} /></ThemeProvider>
}

export default MyApp
