import React from 'react'
import FacebookFeed from '@/components/FacebookFeed'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rybářský řád | Ryby Semín',
  description: 'Pravidla sportovního rybolovu "chyť a pusť" na vodní nádrži Tomášek v Semíně – povolené vybavení, doba lovu a šetrné zacházení s rybou.',
  keywords: ['Ryby Semín', 'rybářský řád', 'pravidla rybolov', 'chyť a pusť', 'rybník Tomášek'],
}

const RuleRow = ({ children }: { children: React.ReactNode }) => (
  <li className="mb-2 flex items-start before:content-['🎣'] before:mr-2 before:shrink-0">{children}</li>
)

export default function FishingRulesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        <article className="prose max-w-none prose-blue">
          <h1 className="text-4xl font-bold text-blue-700 mb-6">Rybářský řád</h1>

          <p>
            Abychom si všichni užili lov i pobyt u vody, platí na Tomáškovi několik jasných
            pravidel. Vycházejí z celostátní legislativy (zákon 99/2004 Sb. a
            vyhláška 197/2004 Sb.), ale současně zohledňují specifika našeho soukromého
            revíru chyť a pusť.
          </p>

          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4">Základní zásady</h2>
          <ul>
            <RuleRow>
              Lov probíhá výhradně metodou chyť a pusť. Všechny ulovené ryby se
              po šetrném vyháčkování vrací zpět.
            </RuleRow>
            <RuleRow>
              Mějte u sebe podložku vaničkového typu pro šetrné zachazení s rybou.
            </RuleRow>
            <RuleRow>
              Povolený počet prutů: 2&nbsp;ks; každá udice může být opatřena pouze jedním návazcem s&nbsp;jednoháčkem.
            </RuleRow>
            <RuleRow>
              Pro lov na položenou vyžadujeme průjezdnou únikovou montáž.
            </RuleRow>
            <RuleRow>
              Pletená šňůra je zakázána!
            </RuleRow>
            <RuleRow>
              Denní doba lovu: 8:00&nbsp;– 20:00 (případně dle zakoupeného tarifu – viz
              ceník).
            </RuleRow>
            <RuleRow>
              Při focení rybu vždy držte nízko nad podložkou a pouze po dobu nezbytně nutnou. Zákaz focení vestoje!
            </RuleRow>
            <RuleRow>
              Zakázané způsoby lovu: živá či mrtvá rybka, srkačky, více než 2&nbsp;háčky na montáži,
              zavážení nástrah pomocí loděk.
            </RuleRow>
          </ul>

          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4">Ochrana ryb a&nbsp;prostředí</h2>
          <ul>
            <RuleRow>
              Rybu nikdy nepokládejte na holou zem. K dispozici jsou dezinfekce a podložky –
              při&nbsp;potřebě zapůjčíme.
            </RuleRow>
            <RuleRow>
              Při focení rybu vždy držte nízko nad podložkou a&nbsp;maximálně pár vteřin mimo vodu.
            </RuleRow>
            <RuleRow>
              Odpadky si každý lovec odnáší&nbsp;sebou; na&nbsp;břehu chceme pořádek.
            </RuleRow>
          </ul>

          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4">Kontrola a&nbsp;sankce</h2>
          <p>
            Dodržování řádu kontroluje správa revíru. Porušení pravidel může vést k okamžitému
            ukončení povolenky bez náhrady. V&nbsp;závažných případech (např. ponechání si úlovku,
            úmyslné poškození ryby) předáváme věc Policii&nbsp;ČR.
          </p>

          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4">Dokumenty ke stažení</h2>
          <p>
            Kompletní znění zákonných předpisů a&nbsp;aktuální soupis revírů Českého rybářského svazu
            najdete na&nbsp;
            <a href="https://www.rybsvaz.cz/" target="_blank" rel="noopener" className="text-blue-700 font-semibold hover:underline">webu ČRS</a>.
          </p>

          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4">Rezervace a platby</h2>
          <p>
            Denní i vícedenní povolenky vyřídíte na stránce Rezervujte nebo osobně přímo na pláži u rybníka Tomášek.
          </p>
          <p>
            Zaplatit můžete hotově nebo QR platbou. Uvedené ceny zahrnují DPH.
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
    </main>
  )
} 