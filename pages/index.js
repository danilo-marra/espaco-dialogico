import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

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

      <main className="container text-center">
        <Image
          src={"/img/logo.png"}
          width={400}
          height={400}
          className="img-fluid"
          alt="Espaço Dialógico - Clínica de Psicologia Infantil"
        />

        <div>
          <p>Site em construção</p>
          <p className="instagram-link">
            Acompanhe em nossa{" "}
            <a href="https://www.instagram.com/espacodialogico/">
              <span className="bold-500">Rede Social</span>{" "}
              <i className="bi bi-instagram"></i>
            </a>
          </p>
        </div>
        <div>
          <Link href="/dashboard">
            <a>sistema</a>
          </Link>
        </div>
      </main>
    </>
  );
}

export default Home;
