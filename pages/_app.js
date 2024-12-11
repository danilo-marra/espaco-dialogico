import 'bootstrap/dist/css/bootstrap.min.css'; // Importa o CSS do Bootstrap
import 'bootstrap-icons/font/bootstrap-icons.css'; // Importa os ícones do Bootstrap
// import '../style/estilo.css'; // Importa seu CSS customizado
// import '../styles/globals.css'; // Opcional: se você tiver outros estilos globais

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;