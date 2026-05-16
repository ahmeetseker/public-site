/**
 * Mock seed — TKGM (Tapu ve Kadastro Genel Müdürlüğü) parsel veritabanı
 * (Wave F36 / Faz 1).
 *
 * 50 mock parsel:
 *   - 5 il × ~10 ilçe (İstanbul, Ankara, İzmir, Bursa, Antalya)
 *   - Status karması: ~75% temiz, ~12% şerh, ~8% ipotekli, ~5% diğer
 *   - Hisse oranı 0.1-1.0, yüzölçümü 200-50,000 m²
 *   - Cinsi: ağırlık Arsa+Tarla, az Bağ/Bahçe/Zeytinlik
 *
 * `simulateTkgmLatency()`: 800-3,300 ms random gecikme (gerçek API
 * latency hissi için).
 *
 * F36 Faz 2 (`/ilan-ver` wizard step 1 TKGM widget) bu seed üzerinde
 * `il + ilçe + ada + parsel` ile arama yapar.
 */

import type { TkgmParcel } from '../types/landxpanel-deepening'

interface ParcelSeed {
  id: string
  il: string
  ilce: string
  mahalle?: string
  ada: string
  parsel: string
  pafta?: string
  yuzolcumu: number
  cinsi: TkgmParcel['cinsi']
  hisseOrani: number
  status: TkgmParcel['status']
  ownerName?: string
}

const SEEDS: ReadonlyArray<ParcelSeed> = [
  // ── İstanbul (12) ──────────────────────────────────────────────────────
  { id: 'tkgm-001', il: 'İstanbul', ilce: 'Tuzla', mahalle: 'Aydınlı', ada: '1024', parsel: '7', pafta: 'F22D11A', yuzolcumu: 1850, cinsi: 'Arsa', hisseOrani: 1.0, status: 'temiz', ownerName: 'Mehmet Yılmaz' },
  { id: 'tkgm-002', il: 'İstanbul', ilce: 'Şile', mahalle: 'Akçakese', ada: '218', parsel: '14', yuzolcumu: 4200, cinsi: 'Tarla', hisseOrani: 0.5, status: 'temiz', ownerName: 'Ayşe Demir' },
  { id: 'tkgm-003', il: 'İstanbul', ilce: 'Çatalca', mahalle: 'Subaşı', ada: '301', parsel: '2', yuzolcumu: 12500, cinsi: 'Tarla', hisseOrani: 1.0, status: 'ipotekli', ownerName: 'Ali Kaya' },
  { id: 'tkgm-004', il: 'İstanbul', ilce: 'Silivri', mahalle: 'Selimpaşa', ada: '512', parsel: '21', yuzolcumu: 2300, cinsi: 'Arsa', hisseOrani: 0.25, status: 'temiz', ownerName: 'Zeynep Şahin' },
  { id: 'tkgm-005', il: 'İstanbul', ilce: 'Beykoz', mahalle: 'Anadoluhisarı', ada: '88', parsel: '5', yuzolcumu: 980, cinsi: 'Arsa', hisseOrani: 1.0, status: 'serh', ownerName: 'Hasan Öztürk' },
  { id: 'tkgm-006', il: 'İstanbul', ilce: 'Pendik', mahalle: 'Kurtköy', ada: '1701', parsel: '12', yuzolcumu: 650, cinsi: 'Arsa', hisseOrani: 1.0, status: 'temiz', ownerName: 'Fatma Aksoy' },
  { id: 'tkgm-007', il: 'İstanbul', ilce: 'Arnavutköy', mahalle: 'Hadımköy', ada: '402', parsel: '38', yuzolcumu: 8500, cinsi: 'Tarla', hisseOrani: 0.75, status: 'temiz', ownerName: 'Mustafa Çelik' },
  { id: 'tkgm-008', il: 'İstanbul', ilce: 'Maltepe', mahalle: 'Başıbüyük', ada: '224', parsel: '9', yuzolcumu: 1200, cinsi: 'Arsa', hisseOrani: 0.33, status: 'tedbir', ownerName: 'Hülya Arslan' },
  { id: 'tkgm-009', il: 'İstanbul', ilce: 'Sancaktepe', mahalle: 'Sarıgazi', ada: '655', parsel: '4', yuzolcumu: 540, cinsi: 'Arsa', hisseOrani: 1.0, status: 'temiz', ownerName: 'Emre Yıldız' },
  { id: 'tkgm-010', il: 'İstanbul', ilce: 'Sarıyer', mahalle: 'Garipçe', ada: '15', parsel: '3', yuzolcumu: 3100, cinsi: 'Tarla', hisseOrani: 0.5, status: 'temiz', ownerName: 'Sevgi Polat' },
  { id: 'tkgm-011', il: 'İstanbul', ilce: 'Eyüpsultan', mahalle: 'Akpınar', ada: '188', parsel: '11', yuzolcumu: 1750, cinsi: 'Bahçe', hisseOrani: 1.0, status: 'temiz', ownerName: 'İbrahim Korkmaz' },
  { id: 'tkgm-012', il: 'İstanbul', ilce: 'Şile', mahalle: 'Teke', ada: '402', parsel: '17', yuzolcumu: 6800, cinsi: 'Tarla', hisseOrani: 0.4, status: 'serh', ownerName: 'Selin Yavuz' },

  // ── Ankara (10) ────────────────────────────────────────────────────────
  { id: 'tkgm-013', il: 'Ankara', ilce: 'Çankaya', mahalle: 'Beytepe', ada: '28311', parsel: '6', yuzolcumu: 720, cinsi: 'Arsa', hisseOrani: 1.0, status: 'temiz', ownerName: 'Ahmet Güneş' },
  { id: 'tkgm-014', il: 'Ankara', ilce: 'Polatlı', mahalle: 'Karayavşan', ada: '101', parsel: '45', yuzolcumu: 25000, cinsi: 'Tarla', hisseOrani: 1.0, status: 'temiz', ownerName: 'Hatice Tekin' },
  { id: 'tkgm-015', il: 'Ankara', ilce: 'Gölbaşı', mahalle: 'İncek', ada: '110215', parsel: '18', yuzolcumu: 1100, cinsi: 'Arsa', hisseOrani: 0.5, status: 'ipotekli', ownerName: 'Cengiz Akın' },
  { id: 'tkgm-016', il: 'Ankara', ilce: 'Beypazarı', mahalle: 'Doğanyurt', ada: '305', parsel: '8', yuzolcumu: 4800, cinsi: 'Bağ', hisseOrani: 0.66, status: 'temiz', ownerName: 'Meryem Doğan' },
  { id: 'tkgm-017', il: 'Ankara', ilce: 'Etimesgut', mahalle: 'Bağlıca', ada: '45612', parsel: '3', yuzolcumu: 850, cinsi: 'Arsa', hisseOrani: 1.0, status: 'temiz', ownerName: 'Osman Bakır' },
  { id: 'tkgm-018', il: 'Ankara', ilce: 'Kızılcahamam', mahalle: 'Pazar', ada: '177', parsel: '22', yuzolcumu: 15500, cinsi: 'Tarla', hisseOrani: 1.0, status: 'temiz', ownerName: 'Nuray Kılıç' },
  { id: 'tkgm-019', il: 'Ankara', ilce: 'Çubuk', mahalle: 'Esenboğa', ada: '88', parsel: '14', yuzolcumu: 9200, cinsi: 'Tarla', hisseOrani: 0.25, status: 'serh', ownerName: 'Burak Aydın' },
  { id: 'tkgm-020', il: 'Ankara', ilce: 'Mamak', mahalle: 'Karaağaç', ada: '36105', parsel: '11', yuzolcumu: 320, cinsi: 'Arsa', hisseOrani: 1.0, status: 'temiz', ownerName: 'Esra Çetin' },
  { id: 'tkgm-021', il: 'Ankara', ilce: 'Yenimahalle', mahalle: 'Susuz', ada: '63411', parsel: '7', yuzolcumu: 1450, cinsi: 'Arsa', hisseOrani: 0.5, status: 'temiz', ownerName: 'Tarık Şen' },
  { id: 'tkgm-022', il: 'Ankara', ilce: 'Haymana', mahalle: 'Yenice', ada: '244', parsel: '38', yuzolcumu: 32000, cinsi: 'Tarla', hisseOrani: 0.75, status: 'temiz', ownerName: 'Pınar Erol' },

  // ── İzmir (10) ─────────────────────────────────────────────────────────
  { id: 'tkgm-023', il: 'İzmir', ilce: 'Urla', mahalle: 'Yağcılar', ada: '127', parsel: '4', yuzolcumu: 5400, cinsi: 'Zeytinlik', hisseOrani: 1.0, status: 'temiz', ownerName: 'Kemal Sönmez' },
  { id: 'tkgm-024', il: 'İzmir', ilce: 'Seferihisar', mahalle: 'Sığacık', ada: '218', parsel: '11', yuzolcumu: 2800, cinsi: 'Bahçe', hisseOrani: 0.5, status: 'temiz', ownerName: 'Yasemin Bal' },
  { id: 'tkgm-025', il: 'İzmir', ilce: 'Çeşme', mahalle: 'Alaçatı', ada: '5023', parsel: '8', yuzolcumu: 1200, cinsi: 'Arsa', hisseOrani: 1.0, status: 'ipotekli', ownerName: 'Berkay Demir' },
  { id: 'tkgm-026', il: 'İzmir', ilce: 'Foça', mahalle: 'Yenibağarası', ada: '309', parsel: '14', yuzolcumu: 4100, cinsi: 'Zeytinlik', hisseOrani: 0.66, status: 'temiz', ownerName: 'Aylin Koç' },
  { id: 'tkgm-027', il: 'İzmir', ilce: 'Karaburun', mahalle: 'Mordoğan', ada: '155', parsel: '6', yuzolcumu: 8700, cinsi: 'Tarla', hisseOrani: 1.0, status: 'serh', ownerName: 'Hakan Avcı' },
  { id: 'tkgm-028', il: 'İzmir', ilce: 'Bornova', mahalle: 'Doğanlar', ada: '13201', parsel: '17', yuzolcumu: 920, cinsi: 'Arsa', hisseOrani: 0.33, status: 'temiz', ownerName: 'Deniz Kaya' },
  { id: 'tkgm-029', il: 'İzmir', ilce: 'Tire', mahalle: 'Eski', ada: '402', parsel: '23', yuzolcumu: 18500, cinsi: 'Tarla', hisseOrani: 1.0, status: 'temiz', ownerName: 'Hüseyin Pekin' },
  { id: 'tkgm-030', il: 'İzmir', ilce: 'Selçuk', mahalle: 'Şirince', ada: '88', parsel: '12', yuzolcumu: 3600, cinsi: 'Bağ', hisseOrani: 0.5, status: 'temiz', ownerName: 'Gülşah Demirci' },
  { id: 'tkgm-031', il: 'İzmir', ilce: 'Menderes', mahalle: 'Develi', ada: '244', parsel: '5', yuzolcumu: 6200, cinsi: 'Tarla', hisseOrani: 0.75, status: 'tedbir', ownerName: 'Onur Yağcı' },
  { id: 'tkgm-032', il: 'İzmir', ilce: 'Bergama', mahalle: 'Asarlık', ada: '511', parsel: '19', yuzolcumu: 4750, cinsi: 'Zeytinlik', hisseOrani: 1.0, status: 'temiz', ownerName: 'Sema Doğru' },

  // ── Bursa (9) ──────────────────────────────────────────────────────────
  { id: 'tkgm-033', il: 'Bursa', ilce: 'İznik', mahalle: 'Boyalıca', ada: '203', parsel: '7', yuzolcumu: 7500, cinsi: 'Bahçe', hisseOrani: 1.0, status: 'temiz', ownerName: 'Kadir Sezer' },
  { id: 'tkgm-034', il: 'Bursa', ilce: 'Mudanya', mahalle: 'Trilye', ada: '418', parsel: '11', yuzolcumu: 2100, cinsi: 'Arsa', hisseOrani: 0.5, status: 'temiz', ownerName: 'Tülay Erdem' },
  { id: 'tkgm-035', il: 'Bursa', ilce: 'Karacabey', mahalle: 'Yeniköy', ada: '155', parsel: '32', yuzolcumu: 22000, cinsi: 'Tarla', hisseOrani: 1.0, status: 'haciz', ownerName: 'Ferhat Yılmaz' },
  { id: 'tkgm-036', il: 'Bursa', ilce: 'Nilüfer', mahalle: 'Görükle', ada: '4502', parsel: '14', yuzolcumu: 850, cinsi: 'Arsa', hisseOrani: 1.0, status: 'temiz', ownerName: 'Buse Aktaş' },
  { id: 'tkgm-037', il: 'Bursa', ilce: 'Gemlik', mahalle: 'Umurbey', ada: '288', parsel: '8', yuzolcumu: 5800, cinsi: 'Zeytinlik', hisseOrani: 0.66, status: 'temiz', ownerName: 'Ramazan Çolak' },
  { id: 'tkgm-038', il: 'Bursa', ilce: 'Yıldırım', mahalle: 'Esenevler', ada: '6712', parsel: '4', yuzolcumu: 410, cinsi: 'Arsa', hisseOrani: 0.5, status: 'serh', ownerName: 'Esma Karaca' },
  { id: 'tkgm-039', il: 'Bursa', ilce: 'Orhangazi', mahalle: 'Gedelek', ada: '101', parsel: '17', yuzolcumu: 11200, cinsi: 'Tarla', hisseOrani: 0.75, status: 'temiz', ownerName: 'Volkan Bayraktar' },
  { id: 'tkgm-040', il: 'Bursa', ilce: 'Osmangazi', mahalle: 'Demirtaş', ada: '5302', parsel: '21', yuzolcumu: 660, cinsi: 'Arsa', hisseOrani: 1.0, status: 'temiz', ownerName: 'Sibel Yiğit' },
  { id: 'tkgm-041', il: 'Bursa', ilce: 'Mustafakemalpaşa', mahalle: 'Tatkavaklı', ada: '288', parsel: '38', yuzolcumu: 28500, cinsi: 'Tarla', hisseOrani: 0.5, status: 'temiz', ownerName: 'Bekir Sungur' },

  // ── Antalya (9) ────────────────────────────────────────────────────────
  { id: 'tkgm-042', il: 'Antalya', ilce: 'Kaş', mahalle: 'Çukurbağ', ada: '155', parsel: '6', yuzolcumu: 3400, cinsi: 'Bahçe', hisseOrani: 0.5, status: 'temiz', ownerName: 'Pelin Demir' },
  { id: 'tkgm-043', il: 'Antalya', ilce: 'Kalkan', mahalle: 'Kışla', ada: '218', parsel: '14', yuzolcumu: 1800, cinsi: 'Arsa', hisseOrani: 1.0, status: 'temiz', ownerName: 'Murat Eken' },
  { id: 'tkgm-044', il: 'Antalya', ilce: 'Manavgat', mahalle: 'Side', ada: '402', parsel: '9', yuzolcumu: 4500, cinsi: 'Tarla', hisseOrani: 1.0, status: 'ipotekli', ownerName: 'Gizem Akdağ' },
  { id: 'tkgm-045', il: 'Antalya', ilce: 'Serik', mahalle: 'Belek', ada: '5512', parsel: '11', yuzolcumu: 6800, cinsi: 'Tarla', hisseOrani: 0.33, status: 'temiz', ownerName: 'Cenk Toprak' },
  { id: 'tkgm-046', il: 'Antalya', ilce: 'Demre', mahalle: 'Köşkerler', ada: '88', parsel: '17', yuzolcumu: 9200, cinsi: 'Bahçe', hisseOrani: 0.66, status: 'temiz', ownerName: 'Funda Yıldırım' },
  { id: 'tkgm-047', il: 'Antalya', ilce: 'Alanya', mahalle: 'Kestel', ada: '1224', parsel: '4', yuzolcumu: 720, cinsi: 'Arsa', hisseOrani: 1.0, status: 'temiz', ownerName: 'Ozan Sezgin' },
  { id: 'tkgm-048', il: 'Antalya', ilce: 'Kemer', mahalle: 'Çamyuva', ada: '305', parsel: '12', yuzolcumu: 1450, cinsi: 'Arsa', hisseOrani: 0.5, status: 'serh', ownerName: 'Beste Aydoğan' },
  { id: 'tkgm-049', il: 'Antalya', ilce: 'Aksu', mahalle: 'Solak', ada: '618', parsel: '23', yuzolcumu: 14500, cinsi: 'Tarla', hisseOrani: 1.0, status: 'temiz', ownerName: 'Erkan Yıldız' },
  { id: 'tkgm-050', il: 'Antalya', ilce: 'Korkuteli', mahalle: 'Yelten', ada: '244', parsel: '38', yuzolcumu: 38000, cinsi: 'Tarla', hisseOrani: 0.75, status: 'temiz', ownerName: 'Nilay Gümüş' },
]

export const TKGM_PARCELS: TkgmParcel[] = SEEDS.map((s) => ({ ...s }))

/**
 * Mock TKGM API gecikme simülasyonu — 800-3,300 ms (gerçek SOAP servisinin
 * uzun yanıt sürelerini taklit eder).
 */
export function simulateTkgmLatency(): number {
  return 800 + Math.floor(Math.random() * 2500)
}
