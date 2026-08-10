"""
Browser Agent — Student Portal iş başvuruları
================================================

Bu dosya cheat sheet'in 7. adımındaki 9 soruya verilen cevapları koda döker.
Her bölüm hangi soruyu karşıladığını yorum olarak belirtir.

Çalıştırmadan önce:
  1. .env içine gerçek BEDROCK_API_KEY'i ekle (WhatsApp grubunda paylaşıldı).
  2. job_profile.md içindeki bilgileri doldur.
  3. python agent.py
"""

import asyncio
import os
import subprocess

from dotenv import load_dotenv
from browser_use import Agent, BrowserSession
from browser_use.llm.openai.chat import ChatOpenAI

load_dotenv()

# --- 2. START -------------------------------------------------------------
START_URL = "https://student.exposureai.org"

# --- 5. NAVIGATION ----------------------------------------------------------
# Agent sadece bu domain içinde kalmalı; internal URL tahmin etmemeli.
ALLOWED_DOMAINS = ["student.exposureai.org"]

# --- 3. INPUT ---------------------------------------------------------------
PROFILE_PATH = os.path.join(os.path.dirname(__file__), "job_profile.md")
with open(PROFILE_PATH, "r", encoding="utf-8") as f:
    job_profile = f.read()

# --- 1. GOAL, 6. TOOLS, 7. YASAKLAR, 8. SUCCESS, 9. RECOVERY ---------------
# Beginner Track — 3 challenge sırayla:
#   1. Student Profile Agent   — sandbox profil formu (tamamlandı)
#   2. Project Submission Agent — brifi oku, 5 sandbox projeden tarife
#      uyanı seç, repo + demo linkiyle gönder
#   3. Job Application Agent (Intermediate) — 10 iş başvurusu
TASK = f"""
GOAL: Sol menüden "Beginner Track"e git. Listede 3 challenge var: "Student
Profile Agent", "Project Submission Agent", "Job Application Agent". Zaten
"Kaydedildi ✓" / "Completed" olanları atla, olmayanları sırayla tamamla:

1) STUDENT PROFILE AGENT: Sandbox öğrenci profili formundaki tüm alanları
   job_profile.md bilgileriyle doldur, Kaydet'e bas, "Kaydedildi ✓" görene
   kadar dene.

2) PROJECT SUBMISSION AGENT: "PROJE" dropdown'ından "Personal Website"i
   seç (brifte tarif edilen: kendini/ilgi alanlarını/projelerini tanıtan,
   Vercel'de yayınlanmış kişisel site — bu proje). "REPO BAĞLANTISI" ve
   "DEMO BAĞLANTISI" INPUT alanlarına, sayfada arama yapmadan, doğrudan
   job_profile.md'deki "Personal Website projesi" bölümünde verilen Repo
   ve Demo bağlantılarını YAZ. Sonra "Gönder" butonuna bas ve başarı
   onayını gör.

3) JOB APPLICATION AGENT (Challenge 3, Intermediate): Sayfada 10 iş
   başvurusu listelenecek. Her birini job_profile.md bilgileriyle doldurup
   gönder. Tüm 10 başvuru "Completed" / "Submitted" olana kadar devam et.

Her challenge'ı bitirince Beginner Track listesine geri dön (sol menü veya
"geri" linkiyle) ve tamamlanmamış bir sonraki challenge'a geç.

INPUT: Formları doldururken yalnızca aşağıdaki job_profile.md içeriğini
kullan. Burada olmayan hiçbir bilgiyi uydurma. Bir form burada olmayan bir
bilgi istiyorsa (ör. repo/demo linki gibi sayfada verilen veri) sadece
sayfada gördüğün gerçek veriyi kullan, hiçbir zaman uydurma.
---
{job_profile}
---

NAVIGATION: Sadece exposureai öğrenci portalı domain'i içinde kal. Internal
URL tahmin etme; yalnızca ekranda görünen link ve butonlarla ilerle.

TOOLS: Sadece click, input, scroll, select_dropdown, screenshot ve done
aksiyonlarını kullan. Dosya upload veya JavaScript çalıştırma yapma.

YASAKLAR:
- job_profile.md içinde ve sayfada olmayan hiçbir bilgiyi uydurma.
- "Testi sıfırla" butonuna asla basma.
- Başka bir domain'e gitme.
- Başka öğrencilerin verisine dokunma.
- Zaten "Kaydedildi ✓" / "Completed" olan bir challenge'ı tekrar doldurma.

SUCCESS CONDITION: Görevi yalnızca Beginner Track listesindeki 3
challenge'ın ÜÇÜ DE "Kaydedildi ✓" / "Completed" olarak göründüğünde
tamamlanmış say. Bir tanesi bile eksikse done deme, devam et.

RECOVERY: Bir aksiyon/kaydetme başarısız olursa hata mesajını oku, eksik
alanı düzelt ve tekrar dene. Bir aksiyon başarısız olursa mevcut sayfayı
tekrar gözlemleyip aynı yerden devam et. Bir challenge zaten tamamlanmışsa
atla, sıradakine geç.
"""


async def main():
    # --- 4. LOGIN -----------------------------------------------------------
    # Login öğrenci tarafından Magic Link ile manuel yapılır.
    # Agent aynı browser session'ı login sonrası devralır.
    browser_session = BrowserSession(
        headless=False,
        allowed_domains=ALLOWED_DOMAINS,
        window_position={"width": 200, "height": 100},
        window_size={"width": 1400, "height": 900},
    )
    await browser_session.start()
    await browser_session.navigate_to(START_URL)

    # Otomasyon penceresini öne getir (macOS için) — kafa karışmasın diye.
    subprocess.run(
        [
            "osascript",
            "-e",
            'tell application "Google Chrome" to activate',
        ],
        check=False,
    )

    ready_file = os.path.join(os.path.dirname(__file__), ".ready")
    if os.path.exists(ready_file):
        os.remove(ready_file)

    print(
        "\n1) Magic Link ile login ol.\n"
        "2) Beginner Track > Challenge 1 (Student Profile Agent) sayfasına git.\n"
        "3) Hazır olunca Claude'a 'hazır' de — devam edecek.\n"
    )
    while not os.path.exists(ready_file):
        await asyncio.sleep(1)
    os.remove(ready_file)

    llm = ChatOpenAI(
        model="google.gemma-4-31b",
        api_key=os.environ["BEDROCK_API_KEY"],
        base_url=os.environ["BEDROCK_BASE_URL"],
    )

    agent = Agent(
        task=TASK,
        llm=llm,
        browser_session=browser_session,
        max_actions_per_step=4,
    )

    await agent.run()
    await browser_session.close()


if __name__ == "__main__":
    asyncio.run(main())
