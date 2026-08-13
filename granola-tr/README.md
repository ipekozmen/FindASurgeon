# Granola TR

Türkçe toplantılar için yerel bir Granola alternatifi: Google Meet / Zoom toplantısını sekme+mikrofon
sesiyle kaydeder, Whisper ile Türkçe transkript çıkarır, transkriptten özet/önemli noktalar/kararlar/
TODO listesi üretir ve tüm toplantı notlarını doğal dilde sorgulamana izin verir.

## Özellikler

- **Kayıt**: Tarayıcıdan `getDisplayMedia` (sekme/ekran sesi paylaşımı) + `getUserMedia` (mikrofon)
  akışlarını `AudioContext` ile karıştırıp `MediaRecorder` ile `.webm` olarak kaydeder. Ekstra bir
  meeting-bot ya da Meet/Zoom entegrasyonu gerekmez.
- **Transkript**: Kayıt bitince ses OpenAI Whisper API'sine (`whisper-1`, `language: tr`) gönderilir.
- **Notlar**: Transkript GPT'ye verilir, özet + önemli noktalar + kararlar + sahipli TODO listesi
  JSON olarak çıkarılır.
- **Sorgulama**: Ana sayfadaki arama kutusu tüm bitmiş toplantıların özet/not/transkriptini bağlam
  olarak LLM'e verip Türkçe cevap üretir.
- **Depolama**: Tamamen yerel — SQLite (`better-sqlite3`), `data/granola.db` dosyasında.

## Kurulum

```bash
npm install
cp .env.example .env.local
# .env.local içine OPENAI_API_KEY=sk-... ekle
npm run dev
```

`http://localhost:3000` adresini aç.

### Gerekli

- Node.js 20+
- Bir OpenAI API key (Whisper transkripsiyon + GPT not çıkarımı için)

## Kullanım

1. "Yeni kayıt" ile `/record` sayfasına git, toplantı başlığı gir.
2. "Kaydı başlat" — tarayıcı sana paylaşılacak sekme/pencereyi soracak. **Google Meet/Zoom
   sekmesini seçip "sekme sesini de paylaş" kutusunu işaretlemen gerekir** (Chrome'da bu seçenek
   sekme paylaşımında görünür). Mikrofon izni de istenir; reddedilirse kayıt sadece sistem sesiyle
   devam eder.
3. Toplantı bitince "Kaydı bitir ve işle" — ses yüklenir, arka planda transkript ve notlar
   çıkarılır (birkaç dakika sürebilir).
4. Toplantı detay sayfasında özet, önemli noktalar, kararlar, TODO listesi ve tam transkript
   görüntülenir.
5. Ana sayfadaki arama kutusundan tüm geçmiş toplantılara doğal dille soru sorulabilir.

## Notlar / sınırlamalar

- Whisper API tek dosyada 25MB sınırına sahiptir — çok uzun toplantılarda (~2 saat+) sıkıştırma
  veya parçalama eklemek gerekebilir.
- Sistem sesi yakalama tarayıcı desteğine bağlıdır (Chrome/Edge'de sekme sesi paylaşımı sorunsuz
  çalışır; Safari'de sekme sesi paylaşımı desteklenmez).
- `/api/query` şu an tüm bitmiş toplantıların transkriptini context olarak LLM'e gönderiyor; çok
  sayıda uzun toplantı birikirse token limitine takılabilir (embedding tabanlı arama sonraki adım
  olabilir).

## Deploy

Vercel'de deploy edilebilir, ancak `better-sqlite3` dosya tabanlı SQLite kullandığı için Vercel'in
salt-okunur/geçici dosya sistemi kalıcı depolama sağlamaz — üretimde bir sunucu (VPS, Docker) ya da
Turso/Postgres gibi kalıcı bir veritabanına geçiş önerilir. Yerel/self-host kullanım için
`npm run build && npm run start` yeterlidir.
