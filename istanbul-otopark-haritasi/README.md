# İstanbul Otopark Haritası

İBB (İSPARK) açık verisini kullanarak canlı güncellenen bir otopark haritası. Next.js + Leaflet ile yazıldı.

## Özellikler

- İstanbul geneli 200+ İSPARK otoparkının canlı konumu (harita üzerinde)
- Her otopark için renk kodlu yoğunluk göstergesi (boş / orta / yoğun / dolu)
- Sol panelde arama (isim veya ilçe) yapılabilen otopark kartları: isim, adres/ilçe, çalışma saatleri, boş kapasite
- Karta tıklayınca harita otomatik o otoparka gider ve işaretçiyi vurgular
- Veriler 60 saniyede bir otomatik yenilenir; manuel "Yenile" butonu da mevcut

## Veri kaynağı

`https://api.ibb.gov.tr/ispark/Park` — İSPARK'ın herkese açık, key gerektirmeyen canlı otopark API'si (isim, konum, kapasite, boş yer sayısı, çalışma saatleri, ilçe). `src/app/api/parks/route.ts` bu veriyi çekip normalize eder (60 sn cache).

## Kurulum

```bash
npm install
npm run dev
```

`http://localhost:3000` (port doluysa Next.js otomatik başka porta geçer).

## Bonus: Google Maps trafik katmanı

Header'daki **Trafik** butonu, haritayı Google Maps'e (canlı trafik katmanı + otopark pin'leri) geçirir. Kullanmak için:

1. [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)'da bir proje açıp **Maps JavaScript API**'yi etkinleştirin, bir API key oluşturun.
2. `.env.local.example` dosyasını `.env.local` olarak kopyalayın ve key'i girin:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxxxxx
   ```
3. Sunucuyu yeniden başlatın (`npm run dev`).

Key tanımlı değilse Trafik butonu görünmez, uygulama normal (Leaflet/OSM) haritayla sorunsuz çalışmaya devam eder.
