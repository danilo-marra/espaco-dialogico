import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

export default function Agenda() {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="p-8">
      <Head>
        <title>Agenda</title>
      </Head>
      <h1>Agenda</h1>
    </div>
  );
}
