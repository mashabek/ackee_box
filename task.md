# Úkol - Služba pro doručování do boxů

Cílem úkolu je ověřit technologickou znalost, schopnost navrhnout architekturu a dodat funkční řešení na úrovni běžné práce zkušeného backend vývojáře v Ackee.

# Podmínky odevzdání

Úkol vypracuj samostatně a odevzdej jako jeden git repozitář (ideálně na GitHubu). Texty a popisy analýzy piš v Markdownu přímo do repozitáře. Pracuj tak, jako by šlo o reálnou zakázku, kód by měl být až na mocky externích služeb v produkční kvalitě.

Maximální čas strávený na úkolu by měl být 8 hodin. Více času úkolu nevěnuj a zašli nám řešení, které jsi byl schopný stihnout v tomto čase. **Rozsah analytické části je max. 2 normostrany + diagramy**.

**Součástí odevzdání musí být:**

- počet strávených hodin,
- seznam použitých technologií včetně AI nástrojů (ideálně i jaký model byl využit),
- shrnutí případných nejasností a jejich řešení (např. zvolený přístup).

---

# Zadání

Klient požaduje mobilní aplikaci a API pro doručování balíků do boxů a jejich vyzvednutí. Zadání obsahuje Use Cases, které slouží jako specifikace. Dodal také seznam boxů, které vlastní. Jako backend vývojář jsi zodpovědný za celé serverové řešení. Na základě Use Casů zpracuj úkoly níže.

📄 [Use Cases](https://www.notion.so/20387cec02b18098ac23c79330c6e7c8?pvs=21)

📍 [Seznam výdejních boxů](https://docs.google.com/spreadsheets/d/1ON4KerqY0F_iLcRUgXyfMxuNPYn2DMxV7M05duY5-vo/edit?usp=sharing)

## Úkol č. 1 – Analýza

### 1a) Rizika a problémy

Zanalyzuj požadavky a pokud v zadání shledáš nějaká rizika, která mohou při implementaci nastat – technická, provozní, nejasnosti v zadání – sepiš je a navrhni možnosti řešení (např. úprava zadání nebo doplnění procesu). Uveď předpoklady, kterými se budeš řídit, pokud je něco nejednoznačné.

### 1b) Návrh architektury

Navrhni infrastrukturu backendového systému. Popiš jednotlivé komponenty, jejich roli a jak spolu komunikují. Přilož diagram a jednoduché databázové schéma (pokud dává pro tvé navržené řešení smysl). Počítej s provozem ~100 tis. zásilek denně a desítkami paralelních uživatelů.

Zaměř se jen na části pokrývající Use Case vydávání z boxů jako

- uživatelé (dodavatel),
- výdejní místa,
- balíky,
- objednávky

Očekávej, že košík, položky v objednávkách a zákazníky bude řešit jiná externí služba (v našem systému stačí identifikace zákazníka u objednávky). **Pro jednoduchost předpokládej, že každá objednávka má přesně jeden balík**. Doručovatel je běžný uživatel se speciální rolí.

## Úkol č. 2 – Implementace

Na základě analýzy vytvoř RESTful API v Node.js + TypeScript. Výstup musí být snadno spustitelný na localhostu.

- Ideálně dodej infrastrukturu přes `docker-compose`, případně popiš v `README.md`, jak řešení spustit ručně.
- Kód musí být testovatelný – přilož testy nebo návod k otestování s ukázkovými vstupy
- Pokud řešení odkazuje na jiné služby, stačí funkční mock s komentářem, co reprezentuje. *Příklad:*
    
    ```tsx
    const findCompanyByIdum = (idNum: string): Promise<Company | undefined> => {
        // Mocked. Fetch czech companies from ARES system by ICO (https)
        const company = [
            {
                name: 'Test Company',
                idNum: '12345678',
                address: 'Prague 1, Staroměstská 123',
            },
            {
                name: 'Test Company 2',
                idNum: '99999999',
                address: 'Prague 2, Náhodná 5',
            },
        ].find(company => company.idNum === idNum)
    
        return Promise.resolve(company)
    }
    
    ```
    

### API – výdejní místa

Implementuj servrový endpoint pro vyhledání nejbližších výdejních míst podle aktuální polohy uživatele (souřadnice). Mobilní aplikace tuto polohu zná. Využij dodaný seznam výdejních boxů a postupuj podle odpovídajícího UC.
