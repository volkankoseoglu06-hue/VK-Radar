# Yol uyarıları: kapsam ve güvenilirlik

VK Radar prototipine GPS tabanlı hız hatırlatıcısı ve yol olayı arayüzü eklendi.

## Şu anda çalışanlar
- Tarayıcıdan GPS konum izni isteme.
- Cihaz GPS hız değeri sağlıyorsa km/sa gösterme.
- Eşik aşıldığında, kullanıcı sesli uyarıyı açtıysa Türkçe sesli hatırlatma.
- Sabit radar, mobil denetim, polis/yol kontrolü ve tehlike düğmeleri şimdilik yalnızca arayüz taslağıdır; bildirim göndermez.

## Sonraki aşama
Radar ve yol olayı bildirimlerini haritada göstermek için güncel ve yeniden kullanılabilir bir veri kaynağı, konum doğrulama, zaman damgası ve eski bildirimleri geçersiz kılma mekanizması gerekir. Kaynağı olmayan radar veya polis konumlarını uydurmayız.

## Güvenli sürüş
- Uygulama yalnızca sürüş öncesinde ayarlanmalı; sürüş esnasında ekrana dokunulmamalı.
- Uyarılar hız sınırına uymayı kolaylaştırmak içindir; yasal hız sınırı yol levhaları ve resmi trafik düzenlemeleridir.
- GPS hızı gerçek araç göstergesiyle veya resmi hız ölçüm cihazıyla aynı doğrulukta garanti edilemez.
- Telefon kamerasıyla polis/radar tespit özelliği bu prototipte yoktur.
