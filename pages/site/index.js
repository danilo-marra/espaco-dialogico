import Head from 'next/head';
import Image from 'next/image';

function SitePage() {
  return (
    <>
      <Head>
        <title>Espaço Dialógico - Clínica de Psicologia Infantil</title>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <link
          rel="stylesheet"
          href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
          integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="/style/estilo.css" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css"
        />
      </Head>

      <main className="container text-center">
        <Image
          src={'/img/logo.png'}
          width={200}
          height={200}
          className='img-fluid mb-3'
          alt='Espaço Dialógico - Clínica de Psicologia Infantil'
        />

        <div>
          <Image
            src={'/img/menina2x.jpg'}
            width={900}
            height={700}
            className="img-fluid"
            alt="Espaço de Psicoterapia Infantil em Brasília"
          />

          <p className="mt-4 instagram-link">
            Acompanhe em nossa{' '}
            <a href="https://www.instagram.com/espacodialogico/">
              <span className="bold-500">rede social</span>
              <i className="bi bi-instagram"></i>
            </a>
          </p>
        </div>
      </main>
    </>
  );
}

export default SitePage;