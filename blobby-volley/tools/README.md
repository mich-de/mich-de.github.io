# Strumenti per le voci

Script usati per creare `../voices.js`: tutte le battute dei blob, dette con una voce sintetica con pronuncia napoletana, più le risate.

## File
- `napoletano.py`: trasforma il testo in fonemi napoletani. Parte dalla pronuncia italiana di espeak e applica le regole di [Wikibooks: Napoletano/Pronuncia](https://it.wikibooks.org/wiki/Napoletano/Pronuncia): scevà (ə) sulle vocali finali e atone, s + consonante = [ʃ], gu = [w], gli = [j], j = [j], rotacismo della d, elisioni legate (m'aggio, s'è, 'n culo).
- `estrai_battute.js`: prende tutte le battute da `../index.html`.
- `genera_voci.py`: sintetizza le battute con [Piper TTS](https://github.com/rhasspy/piper) in due voci, `r` per Rosso (it_IT-riccardo-x_low) e `g` per Verde (it_IT-paola-medium). Riscrive `../voices.js` e mantiene le risate già presenti.

## Aggiungere o cambiare battute
1. Modifica `BANTER`, `POINT_LOSER` e `POINT_WINNER` in `../index.html`. Tre livelli: `clean`, `rude`, `blas`. `{town}` viene sostituito col nome della spiaggia, e "Ahahah!" nel testo fa partire una risata.
2. Installa gli strumenti (servono Python 3, Node.js e ffmpeg):
   ```
   python -m venv tts && tts/bin/pip install piper-tts numpy
   ```
3. Scarica le due voci (file `.onnx` e `.onnx.json`) da https://huggingface.co/rhasspy/piper-voices/tree/main/it/it_IT in una cartella, per esempio `voci/`.
4. Rigenera:
   ```
   node estrai_battute.js > battute.json
   tts/bin/python genera_voci.py battute.json voci/
   ```

## Risate
Sei spezzoni da Cesare Monzani, «La risata di Cantalamessa» (Victor, 1923), pubblico dominio (Library of Congress National Jukebox, copia su archive.org: `loc-jukebox-67570-la-risata-di-cantalamessa`), tagliati dai tre ritornelli. Per Verde la tonalità è alzata.
