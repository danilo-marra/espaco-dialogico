import type { AppProps } from "next/app";
import "../styles/globals.css"; // Importa Tailwind CSS
import { useRouter } from "next/router";
import Layout from "components/Layout";

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isDashboard = router.pathname.startsWith("/Dashboard");

  return isDashboard ? (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  ) : (
    <Component {...pageProps} />
  );
}
