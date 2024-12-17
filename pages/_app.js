import "bootstrap/dist/css/bootstrap.min.css"; // Importa o CSS do Bootstrap
import "bootstrap-icons/font/bootstrap-icons.css"; // Importa os ícones do Bootstrap
import "../styles/globals.css"; // Importa Tailwind CSS

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
