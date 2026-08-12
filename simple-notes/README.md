# Basit Not Defteri

Herhangi bir tipte metin dosyası yazıp kaydedebileceğiniz, hafif (Neutralino.js tabanlı, Electron değil) bir masaüstü not defteri uygulaması.

## Özellikler

- Herhangi bir dosya adı/uzantısı ile kaydetme ve açma (Kaydet/Farklı Kaydet, Aç)
  - `.html`/`.htm` olarak kaydedilirse biçimlendirme (kalın/italik/başlık) korunur
  - Diğer tüm uzantılarda (`.txt`, `.md`, vb.) düz metin olarak kaydedilir
- Yazı türleri: Gövde, Başlık 1/2/3, Kalın, İtalik (araç çubuğundan veya kısayollarla)
- Undo/Redo (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
- Auto-save: kaydedilmiş bir dosya üzerinde çalışırken 1.5 saniye yazmama sonrası otomatik kaydeder; pencere kapatılırken de otomatik kaydeder
- Kısayollar: Ctrl/Cmd+N (Yeni), Ctrl/Cmd+O (Aç), Ctrl/Cmd+S (Kaydet), Ctrl/Cmd+Shift+S (Farklı Kaydet), Ctrl/Cmd+B (Kalın), Ctrl/Cmd+I (İtalik), Ctrl/Cmd+Z / Shift+Z (Undo/Redo)
- Tab tuşu odağı değiştirmez, imlecin bulunduğu satıra girinti (tab karakteri) ekler
- **Bonus:** Resim ekleme (araç çubuğundaki "Resim" butonu, dosyayı base64 olarak metne gömer)
- **Bonus:** Toplam program boyutu ~1.7 MB (< 2 MB) — `bin/neutralino-mac_arm64` (~1.4 MB, strip edilmiş) + `resources/` (~0.3 MB)

## Çalıştırma (geliştirme modu)

```bash
npx @neutralinojs/neu run
```

## Dağıtım paketi oluşturma

```bash
npx @neutralinojs/neu build
```

`dist/` klasöründeki ilgili platform binary'si + `resources/` klasörü uygulamanın tamamıdır.

## Teknik notlar

- Bu makinedeki macOS sürümü (12.3.1) Neutralino'nun son binary sürümüyle (v6.9.0, `ScreenCaptureKit` gerektiriyor) uyumlu olmadığından `bin/neutralino-mac_arm64` ve `resources/js/neutralino.js`, uyumlu olan v5.6.0 sürümüne sabitlendi ve boyut için `strip` edildi.
- Diğer platformlar için `bin/` altındaki dosyalar `neu update --latest` ile güncel sürüme yükseltilebilir (macOS 14+ üzerinde sorun oluşturmaz).

## Icon credits

- `trayIcon.png` - Made by [Freepik](https://www.freepik.com) and downloaded from [Flaticon](https://www.flaticon.com)

## License

[MIT](LICENSE)
