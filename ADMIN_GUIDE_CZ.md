# Průvodce pro administrátory - Rezervační systém rybářství

## Přístup do administrace

### Přihlášení
1. Otevřete webovou stránku vašeho rezervačního systému
2. Přidejte `/admin` na konec URL (např. `https://vase-domena.cz/admin`)
3. Zadejte přihlašovací údaje:
   - **E-mail**: admin@rybarstvo.cz
   - **Heslo**: admin123
   - ⚠️ **Důležité**: Změňte heslo po prvním přihlášení!

## Hlavní dashboard

Po přihlášení uvidíte tři hlavní záložky:
- **Rezervace** - správa všech rezervací zákazníků
- **Lovná místa** - správa 15 rybářských míst
- **Závody** - správa rybářských závodů

---

## 📋 Správa rezervací

### Přehled rezervací
- **Zobrazení všech rezervací** v přehledné tabulce
- **Barevné označení**: Zelené pozadí = zaplaceno, bílé = nezaplaceno
- **Řazení**: Klikněte na záhlaví sloupce pro řazení (jméno, datum, cena, atd.)

### Informace o rezervaci
Každá rezervace obsahuje:
- **Jméno, e-mail, telefon** zákazníka
- **Variabilní symbol** pro platbu
- **Vybavení** - co si zákazník půjčil (prut, židle, návnada, atd.)
- **Místo** - číslo lovného místa
- **Datum a délka** rezervace
- **Celková cena**
- **Stav platby**

### Akce s rezervacemi

#### ✅ Označit jako zaplaceno
1. Najděte rezervaci v seznamu
2. Klikněte na tlačítko "Označit jako zaplaceno"
3. Řádek se zbarví zeleně

#### ❌ Zrušit rezervaci
1. Klikněte na červené tlačítko koše u rezervace
2. Potvrďte smazání v dialogu
3. Rezervace bude trvale odstraněna

#### 📊 Export dat
- Klikněte **"Stáhnout CSV"** pro export všech rezervací
- Soubor obsahuje kompletní data pro účetnictví

---

## 🎣 Správa lovných míst

### Přehled míst
- **15 lovných míst** s čísly 1-15
- **Stav každého místa**: Aktivní/Neaktivní
- **Nadcházející rezervace** pro každé místo

### Správa dostupnosti
#### Zapnutí/vypnutí místa
1. Najděte místo v seznamu
2. Použijte **přepínač** (modrý = aktivní, šedý = neaktivní)
3. Neaktivní místa se nezobrazí zákazníkům

#### Kontrola obsazenosti
- **Zelené místo** = volné
- **Červené místo** = obsazené
- **Žluté místo** = částečně obsazené (možnost 24h/48h rezervace)

---

## 🏆 Správa závodů

### Vytvoření nového závodu
1. Přejděte na záložku **"Závody"**
2. Vyplňte formulář:
   - **Název závodu** (např. "Jarní pohár 2024")
   - **Datum a čas** závodu
   - **Kapacita** (počet účastníků)
   - **Vstupné** v Kč
3. Klikněte **"Vytvořit závod"**

⚠️ **Limit**: Maximálně 3 aktivní závody současně

### Správa existujících závodů
#### Aktivace/deaktivace
- Použijte **přepínač** pro zapnutí/vypnutí závodu
- Neaktivní závody se nezobrazí zákazníkům

#### Úprava závodu
1. Klikněte na **ikonu tužky** u závodu
2. Upravte údaje v dialogu
3. Uložte změny

#### Mazání závodu
1. Klikněte na **ikonu koše**
2. Potvrďte smazání
3. ⚠️ **Pozor**: Smaže se i všechny registrace!

### Sledování registrací
- **Progresivní lišta** ukazuje obsazenost
- **Tabulka účastníků** s kontakty
- **Export CSV** pro jednotlivé závody

---

## 💰 Finanční správa

### Sledování plateb
#### Rezervace
- **Zelené řádky** = zaplaceno
- **Bílé řádky** = nezaplaceno
- **Variabilní symboly** pro identifikaci plateb

#### Závody
- **Zelené označení** = zaplaceno
- **Bílé označení** = nezaplaceno
- **Celková částka** zobrazena u každé registrace

### Označování plateb
1. Zkontrolujte platbu v bance podle variabilního symbolu
2. Klikněte **"Označit jako zaplaceno"**
3. Systém automaticky zaktualizuje stav

---

## 📊 Exporty a reporty

### CSV exporty
#### Rezervace
- **Kompletní data** všech rezervací
- **Použití**: Účetnictví, statistiky, zálohy

#### Závody
- **Jednotlivé závody** zvlášť
- **Údaje účastníků** pro organizaci

### Obsah exportu
- Kontaktní údaje zákazníků
- Finanční informace
- Časové údaje
- Informace o vybavení

---

## 🔧 Denní rutina administrátora

### Ranní kontrola
1. **Zkontrolujte nové rezervace** za posledních 24 hodin
2. **Ověřte platby** podle variabilních symbolů
3. **Označte zaplacené rezervace**
4. **Zkontrolujte dostupnost míst**

### Týdenní úkoly
1. **Stáhněte CSV reporty** pro účetnictví
2. **Zkontrolujte nadcházející závody**
3. **Aktualizujte stav míst** (opravy, údržba)

### Měsíční úkoly
1. **Archivujte stará data**
2. **Analyzujte statistiky** obsazenosti
3. **Plánujte nové závody**

---

## ⚠️ Důležité upozornění

### Bezpečnost
- **Změňte výchozí heslo** po prvním přihlášení
- **Nepoužívejte admin přístup** z veřejných počítačů
- **Pravidelně zálohujte data**

### Zálohy
- **CSV exporty** slouží jako záloha
- **Pravidelně stahujte** data
- **Uchovávejte** zálohy na bezpečném místě

---

## 📞 Podpora a technické informace

### Systémové požadavky
- **Moderní webový prohlížeč** (Chrome, Firefox, Safari)
- **Internetové připojení**
- **Doporučeno**: Desktop nebo tablet pro pohodlnou správu

### Známé problémy
- **Mobile**: Plně responzivní verze v přípravě
- **Dark mode**: Připravujeme tmavý režim

---

## 📋 Informace potřebné od klienta

### 🕐 Kalendář a časové sloty
- **Přesné časové intervaly** pro finalizaci logiky překrývajících se rezervací
- **Specifické dny** kdy jsou místa nedostupná
- **Sezónní omezení** (zimní přestávka, údržba)

### 💵 Ceny a platby
- **Aktuální ceník** všech služeb
- **Slevy** (stálí zákazníci, skupiny, sezónní)
- **Příplatky** za speciální služby
- **Platební metody** a podmínky

### 📝 Textové úpravy
- **Aktualizace textů** na webu
- **Popis míst** a jejich specifikace
- **Pravidla** rybaření a pobytu
- **Kontaktní informace**

### 🏢 Informace o provozovně
- **Skutečné údaje** o rybářství
- **Adresa** a GPS souřadnice
- **Provozní doba**
- **Kontaktní osoby**

### 💳 Platební proces
- **Testování plateb** v reálném prostředí
- **Nastavení platební brány**
- **Automatické potvrzování** plateb
- **Řešení problematických plateb**

### 🔧 Další funkce
- **Automatické e-maily** s potvrzením
- **SMS notifikace**
- **Věrnostní program**
- **Hodnocení a recenze**
- **Integrace s meteorologickými daty**

---

## 🗺️ Roadmapa vývoje

### Připravované funkce
- **📱 Mobil + tablet** pro zákazníky i administrátory
- **🌙 Dark mode** pro pohodlnější používání
- **📧 Automatické e-maily**
- **🔔 Push notifikace**
- **⭐ Hodnocení míst**

---

*Vytvořeno pro snadnou správu rezervačního systému rybářství. Pro technickou podporu kontaktujte vývojový tým.* 