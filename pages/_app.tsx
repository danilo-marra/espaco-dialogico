import type { AppProps } from "next/app";
import "../styles/globals.css"; // Importa Tailwind CSS
import { useRouter } from "next/router";
import Layout from "components/Layout";
import { Provider } from "react-redux";
import { store } from "store/store";
import { Toaster } from "sonner"; // Importa o Toaster do sonner
import AuthProvider from "components/AuthProvider";

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isDashboard = router.pathname.startsWith("/dashboard");

  return (
    <AuthProvider>
      {isDashboard ? (
        <Provider store={store}>
          <Layout>
            <Component {...pageProps} />
            <Toaster richColors position="top-right" closeButton />
          </Layout>
        </Provider>
      ) : (
        <>
          <Component {...pageProps} />
          <Toaster richColors position="top-right" closeButton />
        </>
      )}
    </AuthProvider>
  );
}
