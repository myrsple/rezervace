import React from 'react'
import Link from 'next/link'
import FacebookFeed from '@/components/FacebookFeed'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'O nás | Ryby Semín',
  description: 'Příběh sportovního rybolovu Ryby Semín – historie rybníka Tomášek, zázemí a tým provozovatele.',
  keywords: ['Ryby Semín', 'sportovní rybolov', 'o nás', 'rybník Tomášek', 'Semín', 'Přelouč'],
}

export default function AboutPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        <article className="prose max-w-none prose-blue">
          <h1 className="text-4xl font-bold text-blue-700 mb-6">O nás</h1>
          <p>
            Jsme rodinný tým nadšenců, který provozuje sportovní rybolov a plážový areál u průtočné
            vodní nádrže&nbsp;<strong>Tomášek</strong> – místní ji znají také jako <em>Bajkal</em> nebo <em>Kuklovna</em>. Rybník najdete v&nbsp;Semíně, necelých osm kilometrů od
            Přelouče, uprostřed borových lesů a cyklostezek. Zajišťujeme klidné prostředí pro rybáře, rodiny s&nbsp;dětmi i&nbsp;rekreační
            plavce.
          </p>

          {/* Map */}
          <div className="w-full mt-8">
            <iframe
              title="Mapa Ryby Semín"
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7915.189145710021!2d15.525152200473409!3d50.05350992996251!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470c315fb0be01ab%3A0x7b98f4eb48ee9dec!2sSportovn%C3%AD%20rybolov%20Sem%C3%ADn%2C%20z.s.!5e1!3m2!1scs!2sus!4v1749733048313!5m2!1scs!2sus"
              width="100%"
              height="320"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4">Jak to začalo</h2>

          <p>
            Historie rybníka sahá do roku&nbsp;1996, kdy začal jeho výstavbu Josef Tomášek se synem
            Josefem. Původní plocha&nbsp;1,5&nbsp;ha se roku&nbsp;2001 rozšířila na dnešních
            přibližně&nbsp;5&nbsp;ha. Od samého počátku zakladatelé dbali na pozvolné břehy a čistou vodu –
            nádrž je průtočná a&nbsp;voda se vymění přibližně jednou za&nbsp;14&nbsp;dnů. Kvalitu pravidelně testujeme a&nbsp;k osvěžení slouží i venkovní sprcha přímo u pláže.
          </p>

          {/* Photo with overlay caption */}
          <div className="w-full mt-6 mb-6 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tomasek.jpeg" alt="Josef Tomášek se synem Josefem" className="w-full h-auto rounded-lg shadow" />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs pointer-events-none">
              Josef Tomášek se synem Josefem
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4">Co u nás najdete</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>15&nbsp;lovných míst pro&nbsp;<strong>chyť&nbsp;a&nbsp;pusť</strong> rybolov</li>
            <li>pláž s občerstvením</li>
            <li>dětské hřiště a&nbsp;pozvolný vstup do vody</li>
            <li>pravidelné závody, hudební večery a&nbsp;projekce sportovních přenosů</li>
          </ul>

          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4">Proč se k&nbsp;nám hosté vracejí</h2>
          <p>
            Kromě bohaté obsádky kaprů, amurů a dalších ryb oceňují naši návštěvníci především klid,
            čistotu a&nbsp;rodinnou atmosféru. Ať už přijedete na&nbsp;denní rybolov, víkend s
            karavanem, nebo se jen vykoupat, vždycky vás přivítáme s
            úsměvem a&nbsp;rádi poradíme, kde to právě nejlépe bere.
          </p>

          {/* Kontakt */}
          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4">Kontakt</h2>
          <p>
            Telefon:&nbsp;<a href="tel:773291941" className="text-blue-700 font-semibold hover:underline">773&nbsp;291&nbsp;941</a> (Martin&nbsp;Král)<br />
            E-mail:&nbsp;<a href="mailto:info@rybysemin.cz" className="text-blue-700 font-semibold hover:underline">info@rybysemin.cz</a><br />
            Sídlo:&nbsp;Semín&nbsp;60, 535&nbsp;01&nbsp;Semín&nbsp;u&nbsp;Přelouče
          </p>

          <p className="mt-6 font-semibold">
            Těšíme se na&nbsp;vaši návštěvu! <br />
            Tým&nbsp;Ryby&nbsp;Semín
          </p>

          {/* Rezervace info */}
          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4">Rezervace a platby</h2>
          <p>
            Denní i&nbsp;vícedenní povolenky vyřídíte na stránce{' '}
            <Link href="/rezervovat" className="font-semibold text-semin-blue">Rezervovat</Link>{' '}
            nebo osobně přímo na&nbsp;pláži u&nbsp;rybníka Tomášek. Zaplatit můžete hotově nebo QR&nbsp;platbou. Uvedené ceny zahrnují DPH.
          </p>

          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4">Firemní akce a školní výlety</h2>
          <p>
            Chystáte závody, firemní teambuilding nebo školní výlet? Zavolejte nám na 773 291 941 a vypracujeme vám individuální nabídku.
          </p>
        </article>
        <aside className="lg:sticky lg:top-32">
          <FacebookFeed />
        </aside>
      </div>

      {/* Kudy z nudy badge */}
      <div className="mt-14 flex justify-center">
        <a
          href="https://www.kudyznudy.cz/aktivity/sportovni-rybolov-semin"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-semin-blue/30"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kzn.svg"
            alt="Tip na výlet – Kudy z nudy"
            className="h-12 sm:h-16 md:h-20"
          />
        </a>
      </div>
    </main>
  )
} 