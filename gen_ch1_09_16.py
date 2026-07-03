import subprocess
import urllib.parse
import os
import time
import sys

OUTPUT_DIR = r"C:\Users\AMTEC_Terminal_1º\Desktop\DENTRO DE TI OBSERVA SIN AMAR NI ODIAR NI TEMER NI ANSIAR\art_bible_extracted\CUANDO_NO_TENGAS_MIEDO_ART_BIBLE\output\illustrations"

MASTER = ("Cinematic realism, dark psychological fantasy, neoviking cyberpunk nordic, "
          "high-budget production photography, believable physical materials, deep blacks, "
          "cold greys, very contained electric blue and aged gold, controlled volumetric lighting, "
          "sober editorial composition and a single emotional center.")

NEGATIVE = ("no anime, no cartoon, no generic video game aesthetic, no plastic CGI, "
            "no sexualization, no fashion pose, no defective anatomy, no extra fingers, "
            "no generated text, no logos, no watermarks, no gore, no putrefaction, "
            "no viscous monsters, no copies of existing characters")

SASHA = ("Tall athletic neoviking woman, shaved side with long dark braids, "
         "geometric tattoo on half face, discrete piercings, black coat with fur, "
         "technological armor with blue runes")

COUNSELOR = ("Thin athletic man, angular face, black t-shirt, printed suspenders, "
             "dark glasses, octagonal gold watch on left wrist")

FEAR_PRESENCIA = ("organized absence, shadow without stable body, dry smoke, "
                  "fractal branches, barely perceptible eyes, zones where light withdraws")

FEAR_CORPOREA = ("tall impossible body, long limbs, architectural ribcage, "
                 "charcoal and matte obsidian, fractal crown and eyes containing memories")

VERTICAL = "Vertical format 1080x1620, margin for layout, no text."

illustrations = [
    {"id": "CH1-09", "scene": "Repetition: a corridor of doors repeating into darkness, waves of cold grey light rippling across the floor, the phrase marked by rhythm of doors and waves without any written text, sense of echo and recurrence", "characters": "", "seed": 109},
    {"id": "CH1-10", "scene": "Sasha stops, one hand pressed flat against her own chest over the heart, eyes closed in stillness, the entire environment around her frozen and immobile, dust particles suspended in volumetric light, total silence made visible", "characters": SASHA, "seed": 110},
    {"id": "CH1-11", "scene": "La Presencia: the Fear occupies a reflection in a dark mirror or glass surface, the reflection shows a figure that is not Sasha but an organized absence, shadow without stable body, dry smoke and fractal branches where a person should be, barely perceptible eyes in the void", "characters": FEAR_PRESENCIA, "seed": 111},
    {"id": "CH1-12", "scene": "Mirar a los ojos: extreme close-up of two pairs of eyes facing each other in darkness, the eyes are the only illuminated point in the frame, cold electric blue light catching the iris, everything else swallowed by deep black, the intensity of a gaze that refuses to look away", "characters": "", "seed": 112},
    {"id": "CH1-13", "scene": "Revelacion corporea: the impossible body of the Fear appears within the mind's space, towering tall impossible body with long limbs and architectural ribcage of charcoal and matte obsidian, fractal crown rising upward, eyes containing memories like trapped light, emerging from darkness into cold revelation", "characters": FEAR_CORPOREA, "seed": 113},
    {"id": "CH1-14", "scene": "Yo le quiero: Sasha looks at the Counselor with raw vulnerability, her guard lowered, eyes open and unguarded, the Counselor standing still facing her with his dark glasses reflecting her face, a moment of emotional nakedness between two figures in cold grey space", "characters": SASHA + ". " + COUNSELOR, "seed": 114},
    {"id": "CH1-15", "scene": "Siete anos: Sasha stands before a large rain-streaked window, beyond the glass a deformed distorted city skyline bends and warps in the rain, cold blue-grey light, reflection of her face ghosted on the wet glass, the weight of seven years pressing inward", "characters": SASHA, "seed": 115},
    {"id": "CH1-16", "scene": "El portazo: a heavy door slamming shut in foreground, motion blur of the door swinging closed, and in the background a younger version of Sasha visible through the closing gap, smaller and more vulnerable, the moment of separation frozen in time", "characters": SASHA, "seed": 116},
]

def build_prompt(ill):
    parts = [MASTER, ill["scene"]]
    if ill["characters"]:
        parts.append(ill["characters"])
    parts.append(VERTICAL)
    parts.append(NEGATIVE)
    return ". ".join(parts)

def is_png(filepath):
    try:
        with open(filepath, 'rb') as f:
            header = f.read(8)
            return header[:4] == b'\x89PNG'
    except:
        return False

def download_with_retry(ill, seed=None, max_attempts=8):
    if seed is None:
        seed = ill["seed"]
    prompt = build_prompt(ill)
    encoded = urllib.parse.quote(prompt, safe='')
    url = f"https://image.pollinations.ai/prompt/{encoded}?width=1080&height=1620&nologo=true&seed={seed}"
    out_path = os.path.join(OUTPUT_DIR, f"{ill['id']}.png")
    
    # Skip if already successfully downloaded
    if os.path.exists(out_path) and is_png(out_path) and os.path.getsize(out_path) > 10240:
        print(f"[{ill['id'}] Already downloaded ({os.path.getsize(out_path):,} bytes), skipping", flush=True)
        return True
    
    backoff = 30  # Start with 30s backoff
    for attempt in range(max_attempts):
        # Remove old file
        if os.path.exists(out_path):
            os.remove(out_path)
        
        print(f"[{ill['id']}] Attempt {attempt+1}/{max_attempts}, seed={seed}, backoff={backoff}s", flush=True)
        try:
            result = subprocess.run(
                ["curl", "-L", "-s", "-o", out_path, "--max-time", "120", url],
                capture_output=True, text=True, timeout=150
            )
            if os.path.exists(out_path) and is_png(out_path):
                size = os.path.getsize(out_path)
                if size > 10240:
                    print(f"  SUCCESS: {ill['id']}.png ({size:,} bytes)", flush=True)
                    return True
                else:
                    print(f"  PNG but too small ({size} bytes)", flush=True)
            elif os.path.exists(out_path):
                size = os.path.getsize(out_path)
                # Check if it's a rate-limit error
                try:
                    with open(out_path, 'r', errors='replace') as f:
                        content = f.read()[:100]
                    if "Too Many Requests" in content:
                        print(f"  Rate limited (queue full), will retry in {backoff}s", flush=True)
                    else:
                        print(f"  Error response ({size} bytes): {content[:80]}", flush=True)
                except:
                    print(f"  Unknown error ({size} bytes)", flush=True)
            else:
                print(f"  File not created", flush=True)
        except subprocess.TimeoutExpired:
            print(f"  Timeout (curl exceeded 120s)", flush=True)
        except Exception as e:
            print(f"  Error: {e}", flush=True)
        
        if attempt < max_attempts - 1:
            print(f"  Sleeping {backoff}s...", flush=True)
            time.sleep(backoff)
            backoff = min(backoff * 1.5, 120)  # Cap at 120s
    
    # Try alternate seed
    if seed == ill["seed"]:
        print(f"  All attempts failed, trying alternate seed {ill['seed'] + 100}", flush=True)
        return download_with_retry(ill, seed=ill["seed"] + 100, max_attempts=4)
    
    return False

results = {}
for i, ill in enumerate(illustrations):
    success = download_with_retry(ill)
    results[ill["id"]] = "SUCCESS" if success else "FAILED"
    if i < len(illustrations) - 1:
        wait = 15
        print(f"  Brief pause {wait}s before next image...", flush=True)
        time.sleep(wait)

print("\n" + "="*60, flush=True)
print("RESULTS SUMMARY", flush=True)
print("="*60, flush=True)
for img_id, status in results.items():
    print(f"  {img_id}: {status}", flush=True)

succeeded = sum(1 for s in results.values() if s == "SUCCESS")
failed = sum(1 for s in results.values() if s == "FAILED")
print(f"\nTotal: {succeeded} succeeded, {failed} failed out of 8", flush=True)