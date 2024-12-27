import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { InstagramLogo } from "@phosphor-icons/react";
//import { InstagramLogo } from "@phosphor-icons/react/dist/ssr";

function Home() {
  return (
    <>
      <Head>
        <title>Espaço Dialógico - Clínica de Psicologia Infantil</title>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      {/* Add a div for the Sistema link */}
      <div className="absolute top-4 right-4">
        <Link href="/Dashboard/" className="text-blue-600 hover:text-blue-800">
          Sistema
        </Link>
      </div>
      <main className="min-h-screen flex flex-col items-center justify-center">
        <Image
          src={"/img/logo.png"}
          width={400}
          height={400}
          className="mb-8"
          alt="Espaço Dialógico Clínica de Psicologia Infantil"
        />

        <div className="text-center mb-6">
          <p className="mb-2">Site em construção</p>
          <p>
            Acompanhe em nossa{" "}
            <a
              href="https://www.instagram.com/espacodialogico/"
              className="inline-flex items-center"
            >
              <span className="text-rosa flex items-center gap-1">
                Rede Social <InstagramLogo size={24} />
              </span>
            </a>
          </p>
        </div>
      </main>
    </>
  );
}

export default Home;
