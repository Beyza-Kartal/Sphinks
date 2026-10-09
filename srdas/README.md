# Kıvılcım – Eğitim Uygulaması

Figma Make çıktısından çalıştırılabilir React + Vite uygulaması.

## Çalıştırma

```bash
npm install
npm run dev
```

Ardından Vite'ın gösterdiği yerel adresi açın (genellikle `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Backend davranışı

Uygulama şu endpointleri kullanmaya hazırdır:

- `POST /api/giris`
- `POST /api/ogretmen-giris`
- `POST /api/cevap`

Localhost üzerinde backend yoksa uygulama otomatik olarak yerel demo verisine düşer; bu nedenle öğrenci ve öğretmen akışları backend kurmadan test edilebilir. Gerçek backend bu endpointlere cevap verdiğinde gerçek cevaplar kullanılır.

Öğretmen QR kodu `?sinif=KOD` parametresi üretir; öğrenci giriş ekranı bu parametreyi otomatik olarak sınıf kodu alanına doldurur.
