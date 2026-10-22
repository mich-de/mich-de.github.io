# Rigenera ../voices.js con la pronuncia napoletana, mantenendo le risate già presenti.
# Uso: python genera_voci.py battute.json cartella_voci_piper
import json, wave, subprocess, base64, re, os, io, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import numpy as np
from piper import PiperVoice, SynthesisConfig
from napoletano import to_phonemes
lines = json.load(open(sys.argv[1]))
VDIR = sys.argv[2]
OUT = os.path.join(HERE, '..', 'voices.js')
VOICES = {'r': (os.path.join(VDIR, 'it_IT-riccardo-x_low.onnx'), 0.9), 'g': (os.path.join(VDIR, 'it_IT-paola-medium.onnx'), 0.88)}
LAUGH = re.compile(r'ahahah!?', re.I)
old = json.loads(open(OUT).read().split('window.BLOB_VOICES = ', 1)[1].rstrip().rstrip(';'))
def synth(v, text, ls):
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        v.synthesize_wav(text, wf, syn_config=SynthesisConfig(length_scale=ls, noise_scale=0.7, noise_w_scale=0.85))
    buf.seek(0)
    with wave.open(buf) as wf:
        sr = wf.getframerate(); a = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
    idx = np.where(np.abs(a) > 0.005)[0]
    return (a[idx[0]:idx[-1]] if len(idx) else a), sr
def mp3(a, sr):
    pcm = (np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes()
    r = subprocess.run(['ffmpeg', '-loglevel', 'error', '-f', 's16le', '-ar', str(sr), '-ac', '1', '-i', '-', '-ar', '22050', '-b:a', '40k', '-f', 'mp3', '-'], input=pcm, capture_output=True, check=True)
    return base64.b64encode(r.stdout).decode()
data = {'silent': old['silent'], 'laugh_r': old['laugh_r'], 'laugh_g': old['laugh_g']}
ipa_log = {}
for key, (path, ls) in VOICES.items():
    v = PiperVoice.load(path); data[key] = {}
    for t in lines:
        parts = LAUGH.split(t); seq = []
        for i, part in enumerate(parts):
            core = re.sub(r'^[\s,!.?]+|[\s,]+$', '', part)
            if re.search('[A-Za-z]', core):
                ph = to_phonemes(v, core); ipa_log[core] = ph
                a, sr = synth(v, f'[[ {ph} ]]', ls); seq.append(mp3(a, sr))
            if i < len(parts) - 1: seq.append('L')
        data[key][t] = seq
head = ('// Voci generate con Piper TTS (it_IT riccardo e paola), pronuncia napoletana a regole\n'
        '// (scevà finale e atona, s+consonante = [ʃ], gu = [w], gli = [j], rotacismo della d; fonte: it.wikibooks.org/wiki/Napoletano/Pronuncia).\n'
        '// Risate: Cesare Monzani, "La risata di Cantalamessa" (Victor, 1923), pubblico dominio, Library of Congress National Jukebox.\n')
open(OUT, 'w').write(head + 'window.BLOB_VOICES = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
json.dump(ipa_log, open('fonemi.json', 'w'), ensure_ascii=False, indent=0)
print('ok', len(lines), os.path.getsize(OUT))
