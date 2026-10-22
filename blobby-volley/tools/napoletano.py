# Pronuncia napoletana per Piper: grafia -> fonemi espeak (it) -> regole da Wikibooks "Napoletano/Pronuncia"
import re

VOW = set("aeiouɛɔəɐʊɪ")


def prep_text(t):
    t = re.sub(r"Ahahah!?", "", t, flags=re.I)
    t = t.replace("hê", "e").replace("ê", "e").replace("ô", "o")
    t = re.sub(r"\b([sStTmMnNcC])' +'?", r"\1", t)                     # s' 'o magna -> so magna
    t = re.sub(r"\b([A-Za-z])'(?=[A-Za-zàèéìòù])", r"\1", t)        # m'aggio s'è n'è -> maggio sè nè
    t = re.sub(r"(?<![A-Za-zàèéìòóù])è(?![A-Za-zàèéìòóù])", "é", t)    # verbo "è" accentato, non muto
    t = re.sub(r"(?<![A-Za-zàèéìòóù])'(?=[A-Za-z])", "", t)          # 'a 'o 'nu -> a o nu
    t = re.sub(r"(?<=[A-Za-zàèìòù])'(?=[\s!?,.]|$)", "", t)          # va' fa' vafammocc'
    t = t.replace("'", " ")
    t = re.sub(r"\b([nN]) (?=[A-Za-z])", r"\1", t)                  # 'n culo -> nculo
    t = re.sub(r"\bj", "i", t); t = re.sub(r"\bJ", "I", t); t = t.replace("j", "i")   # j = [j] come in "ieri"
    t = re.sub(r"\b([Gg])u(?=[aeioàèéìòù])", lambda m: "W" if m.group(1) == "G" else "w", t)  # guaio -> waio
    t = re.sub(r"\b[Dd](?=[aeiouàèéìòù])", lambda m: "R" if m.group(0) == "D" else "r", t)    # dimme -> rimme
    t = re.sub(r"(?<=[aeiouàèéìòù])d(?=[aeiouàèéìòù])", "r", t)                                # intervocalica
    return re.sub(r"\s+", " ", t).strip()


def neapolitan_ipa(ph, final_a="ɐ"):
    """ph: stringa IPA di una frase (espeak it). Ritorna IPA napoletanizzato."""
    ph = ph.replace("ʎʎ", "jj").replace("ʎ", "j").replace("iʲ", "j").replace("ʲ", "")
    ph = ph.replace("dʒ", "ʤ").replace("tʃ", "ʧ")
    out_words = []
    for w in re.split(r"( )", ph):
        if w == " " or not w:
            out_words.append(w); continue
        chars = list(w)
        letters = [i for i, c in enumerate(chars) if c.isalpha() or c in "əɐ"]
        vowel_idx = [i for i in letters if chars[i] in VOW]
        stress = max(w.find("ˈ"), w.find("ˌ")) if "ˈ" not in w else w.find("ˈ")
        if stress >= 0 and len(vowel_idx) >= 2:
            sv = next((i for i in vowel_idx if i > stress), None)
            for i in vowel_idx:
                if i == sv:
                    continue
                last = i == vowel_idx[-1] and not any(chars[j].isalpha() for j in range(i + 1, len(chars)))
                nxt = chars[i + 1] if i + 1 < len(chars) else ""
                prv = chars[i - 1] if i > 0 else ""
                if chars[i] == "i" and (nxt in VOW or (prv in VOW and last)):   # i accanto a vocale: semivocale
                    chars[i] = "j"; continue
                if i > sv:                       # postoniche: scevà
                    if chars[i] in "eoɛɔiɪ" or (chars[i] in "uʊ" and last):
                        chars[i] = "ə"
                    elif chars[i] == "a" and last:
                        chars[i] = final_a
                elif chars[i] in "eoɛɔ":         # pretoniche e/o: scevà
                    chars[i] = "ə"
        elif stress < 0 and len(vowel_idx) == 1 and len(letters) <= 2 and chars[vowel_idx[0]] == "e":
            chars[vowel_idx[0]] = "ə"            # articolo 'e
        w = "".join(chars)
        # s + consonante (tranne t) -> [ʃ]; z (s sonora) -> [ʒ]
        w = re.sub(r"s(?=[pbkɡfvmnlrɾʧ])", "ʃ", w)
        w = re.sub(r"z(?=[bdɡvmnlrɾ])", "ʒ", w)
        out_words.append(w)
    ph = "".join(out_words)
    return ph.replace("ʤ", "dʒ").replace("ʧ", "tʃ")


def to_phonemes(voice, text, final_a="ɐ"):
    sents = voice.phonemize(prep_text(text))
    return " ".join(neapolitan_ipa("".join(s), final_a) for s in sents)
