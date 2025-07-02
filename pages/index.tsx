import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import {
  InstagramLogo,
  Phone,
  Envelope,
  List,
  X,
  Heart,
  Calendar,
  MapPin,
  Brain,
  Sparkle,
  Feather,
  ShieldCheck,
} from "@phosphor-icons/react";
//import { InstagramLogo } from "@phosphor-icons/react/dist/ssr";

function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <>
      <Head>
        <title>Espaço Dialógico - Clínica de Psicologia Infantil</title>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta
          name="description"
          content="Espaço Dialógico - Psicologia Infantil com acolhimento, leveza e escuta ativa. Atendimento para crianças de 3 a 12 anos."
        />
      </Head>

      <header className="w-full bg-branco shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image
              src={"/img/logo3.png"}
              width={150}
              height={150}
              alt="Espaço Dialógico"
              className="mr-4"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a
              href="#quem-somos"
              className="text-subTitulo hover:text-rosa transition-colors"
            >
              Quem Somos
            </a>
            <a
              href="#missao"
              className="text-subTitulo hover:text-rosa transition-colors"
            >
              Nossa Missão
            </a>
            <a
              href="#visao"
              className="text-subTitulo hover:text-rosa transition-colors"
            >
              Nossa Visão
            </a>
            <a
              href="#valores"
              className="text-subTitulo hover:text-rosa transition-colors"
            >
              Valores
            </a>
            <a
              href="#atendimentos"
              className="text-subTitulo hover:text-rosa transition-colors"
            >
              Atendimentos
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <a
              href="https://www.instagram.com/espacodialogico/"
              className="text-rosa hover:text-opacity-80 transition-opacity"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramLogo size={24} weight="fill" />
            </a>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-subTitulo focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? (
                <X size={28} weight="bold" />
              ) : (
                <List size={28} weight="bold" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white py-4 px-6 shadow-lg absolute w-full z-10 transition-all duration-300 ease-in-out">
            <nav className="flex flex-col space-y-4">
              <a
                href="#quem-somos"
                className="text-subTitulo hover:text-rosa transition-colors py-2 border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Quem Somos
              </a>
              <a
                href="#missao"
                className="text-subTitulo hover:text-rosa transition-colors py-2 border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Nossa Missão
              </a>
              <a
                href="#visao"
                className="text-subTitulo hover:text-rosa transition-colors py-2 border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Nossa Visão
              </a>
              <a
                href="#valores"
                className="text-subTitulo hover:text-rosa transition-colors py-2 border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Valores
              </a>
              <a
                href="#atendimentos"
                className="text-subTitulo hover:text-rosa transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Atendimentos
              </a>
            </nav>
          </div>
        )}
      </header>

      <main className="overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-azul/10 to-branco py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-bold text-titulo mb-4 text-center md:text-left">
                  <span className="text-azul">Espaço Dialógico</span>
                </h1>
                <p className="text-xl md:text-2xl text-subTitulo mb-8 text-center md:text-left">
                  Psicologia Infantil com acolhimento, leveza e escuta ativa
                </p>
                <div className="text-center md:text-left">
                  <a
                    href="#atendimentos"
                    className="bg-rosa text-white px-8 py-3 rounded-full font-medium hover:bg-opacity-90 transition-all transform hover:scale-105"
                  >
                    Agende um Atendimento
                  </a>
                </div>
              </div>
              <div className="hidden md:flex md:w-1/2 justify-end">
                <div className="relative w-full max-w-lg rounded-lg overflow-hidden shadow-xl">
                  <Image
                    src="/img/sala-13.jpg"
                    width={600}
                    height={400}
                    alt="Ambiente acolhedor para crianças"
                    className="rounded-lg w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quem Somos Section */}
        <section id="quem-somos" className="md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <div>
                  <Image
                    src="/img/sala-11.jpg"
                    width={500}
                    height={400}
                    alt="Equipe do Espaço Dialógico"
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="md:w-1/2 md:pl-12">
                <h2 className="text-3xl font-bold text-titulo mb-6">
                  Quem Somos
                </h2>
                <p className="mb-4 text-subTitulo">
                  O Espaço Dialógico é uma clínica de Psicologia Infantil
                  especializada no atendimento de crianças de 3 a 12 anos.
                  Criado por Juliana Barbosa, nosso espaço nasceu do desejo de
                  oferecer uma escuta verdadeira e um cuidado emocional profundo
                  às crianças — e também aos adultos que caminham com elas.
                </p>
                <p className="text-subTitulo">
                  Acreditamos que cada criança tem uma história única, um jeito
                  próprio de sentir, agir e se expressar. Por isso, nossa
                  atuação é pautada na empatia, no respeito e em abordagens
                  fundamentadas na ciência e na humanização.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Nossa Missão Section */}
        <section id="missao" className="py-16 bg-azul/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-titulo mb-8">
              Nossa Missão
            </h2>
            <p className="text-xl text-subTitulo max-w-3xl mx-auto mb-12">
              Ajudar crianças a se tornarem emocionalmente mais fortes, para que
              possam construir relações mais saudáveis — no presente e ao longo
              da vida.
            </p>
            <div className="rounded-lg overflow-hidden shadow-xl max-w-2xl mx-auto">
              <Image
                src="/img/sala-08.jpg"
                width={600}
                height={400}
                alt="Criança brincando com terapeuta"
                className="rounded-lg w-full"
              />
            </div>
          </div>
        </section>

        {/* Nossa Visão Section */}
        <section id="visao" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row-reverse items-center">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pl-12">
                <div className="rounded-lg overflow-hidden shadow-xl">
                  <Image
                    src="/img/sala-10.jpg"
                    width={600}
                    height={400}
                    alt="Materiais lúdicos terapêuticos"
                    className="rounded-lg object-cover w-full h-64 md:h-80"
                  />
                </div>
              </div>
              <div className="md:w-1/2 md:pr-12">
                <h2 className="text-3xl font-bold text-titulo mb-6">
                  Nossa Visão sobre Psicologia
                </h2>
                <p className="mb-4 text-subTitulo">
                  Para nós, a Psicologia é uma ciência que ajuda a criar pontes
                  entre o mundo interno da criança e o olhar dos adultos.
                </p>
                <p className="mb-4 text-subTitulo">
                  Ela é base para relações mais conscientes, mais respeitosas e
                  mais amorosas.
                </p>
                <p className="text-subTitulo">
                  Aqui, usamos abordagens que valorizam o contexto, o vínculo e
                  a individualidade de cada criança.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Valores Section */}
        <section id="valores" className="py-16 bg-azul/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-titulo mb-12 text-center">
              Nossos Valores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <Heart size={28} weight="fill" className="text-rosa mr-2" />
                  <h3 className="text-xl font-semibold text-azul">Empatia</h3>
                </div>
                <p className="text-subTitulo">
                  Sentir com o outro para cuidar de verdade. Aqui, cada criança
                  é ouvida com respeito e os pais são acolhidos sem julgamentos.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <Sparkle size={28} weight="fill" className="text-rosa mr-2" />
                  <h3 className="text-xl font-semibold text-azul">
                    Criatividade
                  </h3>
                </div>
                <p className="text-subTitulo">
                  Respeitamos e valorizamos a linguagem natural da infância — o
                  brincar. É através do lúdico que nos conectamos com o mundo
                  emocional da criança e facilitamos a expressão de seus
                  sentimentos.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <Feather size={28} weight="fill" className="text-rosa mr-2" />
                  <h3 className="text-xl font-semibold text-azul">Leveza</h3>
                </div>
                <p className="text-subTitulo">
                  Transformamos temas delicados em conversas acessíveis, criando
                  um ambiente seguro para todos.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <ShieldCheck
                    size={28}
                    weight="fill"
                    className="text-rosa mr-2"
                  />
                  <h3 className="text-xl font-semibold text-azul">
                    Acolhimento
                  </h3>
                </div>
                <p className="text-subTitulo">
                  Fazemos da nossa clínica um espaço gentil e confiável, onde
                  cada família encontra escuta, orientação e apoio.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Atendimentos Section */}
        <section id="atendimentos" className="py-16 bg-rosa/5">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center">
              <h2 className="text-3xl font-bold text-titulo mb-12 text-center">
                Atendimentos
              </h2>
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl w-full">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <Brain size={24} weight="fill" className="text-rosa mr-2" />
                    <span className="text-subTitulo">
                      Modalidade: Presencial
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPin
                      size={24}
                      weight="fill"
                      className="text-rosa mr-2"
                    />
                    <span className="text-subTitulo">
                      Local: Terraço Shopping (Brasília - DF)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar
                      size={24}
                      weight="fill"
                      className="text-rosa mr-2"
                    />
                    <span className="text-subTitulo">
                      Atendimentos com hora marcada
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Phone size={24} weight="fill" className="text-rosa mr-2" />
                    <a
                      href="tel:+5561992095674"
                      className="text-azul hover:underline"
                    >
                      (61) 99209-5674
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Envelope
                      size={24}
                      weight="fill"
                      className="text-rosa mr-2"
                    />
                    <a
                      href="mailto:contato@espacodialogico.com.br"
                      className="text-azul hover:underline"
                    >
                      contato@espacodialogico.com.br
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center max-w-3xl">
                <p className="text-lg mb-6 text-subTitulo">
                  Toda criança merece ser compreendida — e todo cuidador,
                  apoiado. Se você sente que chegou o momento de buscar ajuda
                  profissional, será um prazer receber sua família no Espaço
                  Dialógico.
                </p>
                <a
                  href="https://wa.me/5561992095674?text=Olá,%20gostaria%20de%20agendar%20uma%20consulta%20no%20Espaço%20Dialógico"
                  className="bg-rosa text-white px-8 py-3 rounded-full font-medium hover:bg-opacity-90 transition-all inline-flex items-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Phone className="mr-2" size={20} />
                  Agende um atendimento com a nossa equipe
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-azul text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 text-center md:text-left flex flex-col items-center md:items-start">
              <Image
                src="/img/logo2.png"
                width={200}
                height={200}
                alt="Espaço Dialógico"
                className="mb-4 mx-auto md:mx-0"
              />
              <p className="text-white/80">
                © {new Date().getFullYear()} Espaço Dialógico. Todos os
                direitos reservados.
              </p>
            </div>
            <div className="flex flex-col space-y-2 text-center md:text-left">
              <h3 className="font-semibold text-lg mb-2">Contato</h3>
              <a
                href="tel:+5561992095674"
                className="text-white/80 hover:text-white flex items-center justify-center md:justify-start"
              >
                <Phone size={16} className="mr-2" /> (61) 99209-5674
              </a>
              <a
                href="mailto:contato@espacodialogico.com.br"
                className="text-white/80 hover:text-white flex items-center justify-center md:justify-start"
              >
                <Envelope size={16} className="mr-2" />{" "}
                contato@espacodialogico.com.br
              </a>
              <a
                href="https://www.instagram.com/espacodialogico/"
                className="text-white/80 hover:text-white flex items-center justify-center md:justify-start"
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramLogo size={16} className="mr-2" /> @espacodialogico
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Home;
