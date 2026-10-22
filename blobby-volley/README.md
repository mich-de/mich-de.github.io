# Blobby Volley · Penisola sorrentina

Remake per browser di Blobby Volley, da giocare sul telefono. Si gioca contro il computer o in due sullo stesso schermo.

**Gioca:** https://mich-de.github.io/blobby-volley/

## Cosa c'è
- Comandi touch (◀ ▶ SALTA) e tastiera (A D W per Rosso, frecce per Verde)
- Fisica ispirata all'originale: massimo 3 tocchi per lato, si vince a 15
- Regole classiche (punto solo al servizio) oppure rally
- Otto spiagge disegnate: Meta, Piano di Sorrento, Sant'Agnello, Sorrento, Massa Lubrense, Positano, Praiano, Conca dei Marini
- Dopo ogni punto e a fine partita i blob si sfottono in napoletano (linguaggio regolabile: Pulito, Sboccato, Coi santi), con fumetti e voci

## File
- `index.html`: il gioco completo (HTML, CSS e JavaScript in un solo file)
- `voices.js`: voci delle battute e risate in MP3 (base64)
- `tools/`: script per rigenerare le voci con la pronuncia napoletana (istruzioni in `tools/README.md`)

## Crediti
- Voci generate con [Piper TTS](https://github.com/rhasspy/piper) (voci it_IT riccardo e paola), con la pronuncia napoletana applicata suono per suono secondo [Wikibooks: Napoletano/Pronuncia](https://it.wikibooks.org/wiki/Napoletano/Pronuncia): scevà (ə) sulle vocali finali e atone, s + consonante = [ʃ], gu = [w], gli = [j], rotacismo della d
- Risate: Cesare Monzani, «La risata di Cantalamessa» (Victor, 1923), pubblico dominio, Library of Congress National Jukebox
- Ispirato a Blobby Volley (1999) e Blobby Volley 2
