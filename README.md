# Administrátorský manuál – Rezervační systém rybářství

Tento dokument slouží jako přehledný návod pro správu rezervačního systému lovných míst a závodů. Je určen pro administrátory a správce systému.

## Hlavní sekce administrace

Po přihlášení uvidíte tři hlavní záložky:
- **Rezervace** – správa všech rezervací zákazníků
- **Lovná místa** – správa jednotlivých míst a jejich dostupnosti
- **Závody** – správa rybářských závodů a přihlášek

---

## 1. Rezervace

- **Tabulka rezervací**: Přehled všech aktuálních i minulých rezervací.
- **Řazení**: Kliknutím na záhlaví sloupce můžete řadit podle jména, data, ceny atd.
- **Stav platby**: U každé rezervace lze označit, zda je zaplacena.
- **Mazání rezervace**: Klikněte na ikonu koše a potvrďte smazání.
- **Export**: Tlačítko "Stáhnout CSV" umožňuje exportovat rezervace pro jednoduché odbavování na místě a účetnictví.

## 2. Lovná místa

- **Přehled míst**: Zobrazení všech lovných míst, jejich stavu (aktivní/neaktivní) a nejbližší rezervace.
- **Změna dostupnosti**: Přepínačem lze místo aktivovat/deaktivovat. Neaktivní místo není možné rezervovat.
- **Barevné označení**: Zelená = volné, červená = obsazené, žlutá = částečně obsazené, šedá = minulost.
- **Příští rezervace**: U každého místa je v zeleném boxu zvýrazněn příští rybář, včetně data, kontaktu a stavu platby.
- **Stav platby**: U každého účastníka lze manuálně označit, zda má zaplaceno. Údaj se propíše do exportu CSV souborů.

## 3. Závody

- **Vytvoření závodu**: Vyplňte název, datum, kapacitu a vstupné. Klikněte na "Vytvořit závod".
- **Správa závodů**: Aktivace/deaktivace, úprava údajů, mazání závodu (včetně všech přihlášek).
- **Přihlášky**: Tabulka registrovaných účastníků s možností řazení a exportu do CSV.
- **Stav platby**: U každého účastníka lze manuálně označit, zda má zaplaceno. Údaj se propíše do exportu CSV souborů.

---

## Práce s kalendářem

- **Barvy v kalendáři**:
  - Zelená: místo je volné
  - Červená: místo je obsazené
  - Žlutá: částečně obsazené (např. denní rezervace, ale 24/48h je možné)
  - Fialová: koná se závod
  - Šedá: minulost, nelze rezervovat
- **Navigace**: Pomocí šipek přecházíte mezi měsíci. Aktuální měsíc je zobrazen vpravo nahoře.
- **Kliknutí na den**: Otevře možnost vytvořit rezervaci, pokud je den volný.

## Nejčastější úkony

- **Označení platby**: Zaškrtněte políčko u rezervace nebo účastníka závodu.
- **Zrušení rezervace**: Klikněte na koš, potvrďte smazání.
- **Export dat**: Využijte tlačítko "Stáhnout CSV" v sekci rezervací nebo závodů.
- **Změna dostupnosti místa**: Přepněte stav v sekci Lovná místa.

## Doporučení a tipy

- Při změně údajů závodu nebo místa vždy zkontrolujte, zda nedojde ke konfliktu s existujícími rezervacemi.
- Pokud narazíte na problém, zkuste stránku obnovit (F5) nebo chvíli počkejte – web komunikuje s databází.

## Next steps

- Potřebuju přesný popis time slots pro odělání rezervací a překlenů mezi dny a půldny
- Jaké jsou skutečné ceny?
- Upravíme nějak texty / layout?
- Jaké skutečně nabízíte rental a prodeje a za jaké ceny?
- Jaké jsou skutečné platební údaje?
- Stačí takhle funkce, chybí něco dalšího? Můžem cokoliv přidat
- Mobil a tablet jsem ještě neoptimalizoval ale funguje to docela ok
- Emailové funkce zatím nefungují vůbec, ale můžeme napojit
- Podařilo se vám něco rozbít, nebo jste se někde zasekli?
