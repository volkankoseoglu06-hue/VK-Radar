# VK Analiz
Havacılık ve savunma projelerinde kullanılan standart parça ve metal malzemeler için BOM, teorik ağırlık ve kaynaklı fiyat kayıtları prototipi.

## Özellikler
- Excel BOM içe aktarma ve kalem kalem düzenleme
- Plaka/sac, lama, yuvarlak çubuk, boru, köşebent ve kutu profil için teorik ağırlık hesaplama
- Carr Lane, McMaster-Carr ve ISO/DIN/NAS/MS standartlarında arama bağlantıları
- Türkiye metal tedarikçileri için kaynak URL'siyle fiyat kaydı
- Analiz sonuçlarını Excel'e aktarma

## Çalıştırma
GitHub Pages üzerinden yayınlanabilir. Excel işlevleri için XLSX kütüphanesi yüklenebilmelidir. Yerel test için VS Code Live Server veya statik web sunucusu kullanın.

## Sınırlamalar
Bu erken prototip tedarikçi sitelerinden otomatik ve sürekli fiyat çekmez. Fiyatlar kullanıcı tarafından girilir; kaynak URL'si, türü ve tarihi saklanır. Sürekli fiyat güncellemesi için tedarikçi API/CSV beslemesi veya kaynakların kullanım koşullarına uygun sunucu tarafı entegrasyon gerekir.

Ağırlık hesapları teoriktir; gerçek profil kesiti, köşe radyüsleri, toleranslar, delikler, talaş kaldırma ve kesim firesi dahil değildir. Köşebent ve profil formüllerini satın alma/imalat öncesi üretici katalog değerleriyle doğrulayın. BOM sütun eşleştirmesi her Excel düzeninde kusursuz çalışmayabilir; içeri aktarılan sonucu kontrol edin.

## Veriler
BOM ve fiyat kayıtları tarayıcının localStorage alanında saklanır. Tarayıcı verileri silinirse kayıtlar kaybolabilir. Hassas savunma proje dosyalarını onaylanmamış web ortamlarına yüklemeyin.
