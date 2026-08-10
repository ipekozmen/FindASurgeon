# Browser Agent Lab — Student Portal İş Başvuruları

Exposure AI Academy Browser Agent Cheat Sheet'i takip eden proje.

## Dosyalar

- `agent.py` — asıl Browser Agent. Goal/Input/Navigation/Tools/Yasaklar/Success/Recovery
  tasarımı dosyanın başındaki yorumlarda ve `TASK` değişkeninde.
- `job_profile.md` — agent'ın kullanacağı TEK bilgi kaynağı. Doldurmadan agent çalıştırma.
- `smoke_test.py` — browser'ın açıldığını doğrulayan küçük test.
- `.env` — `BEDROCK_API_KEY` ve `BEDROCK_BASE_URL` (gerçek key WhatsApp grubunda paylaşıldı).

## Kurulum (tamamlandı)

```
uv venv --python 3.12
source .venv/bin/activate
uv pip install browser-use==0.13.7 python-dotenv
```

## Çalıştırma sırası

1. `job_profile.md` içindeki bilgileri doldur.
2. `.env` içine gerçek `BEDROCK_API_KEY` değerini yapıştır.
3. `python smoke_test.py` — browser açılıyor mu kontrol et.
4. `python agent.py` — browser açılınca Magic Link ile login ol, terminalde Enter'a bas,
   agent devam eder.

## Success Condition

Sayfada **"Challenge Complete ✓"** ve **"10 / 10 Applications Submitted"** görülmeden
görev tamamlanmış sayılmaz.
