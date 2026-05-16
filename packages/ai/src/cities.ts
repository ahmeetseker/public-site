export interface CityFixture {
  name: string;
  lat: number;
  lng: number;
  districts: string[];
}

export const TR_CITIES: CityFixture[] = [
  { name: 'İstanbul', lat: 41.0082, lng: 28.9784, districts: ['Beykoz', 'Şile', 'Sarıyer', 'Çatalca', 'Silivri', 'Pendik', 'Tuzla', 'Arnavutköy', 'Eyüpsultan', 'Beylikdüzü'] },
  { name: 'Ankara', lat: 39.9334, lng: 32.8597, districts: ['Çankaya', 'Yenimahalle', 'Etimesgut', 'Polatlı', 'Beypazarı', 'Sincan', 'Kazan', 'Akyurt'] },
  { name: 'İzmir', lat: 38.4192, lng: 27.1287, districts: ['Urla', 'Çeşme', 'Seferihisar', 'Selçuk', 'Foça', 'Aliağa', 'Bergama', 'Menemen'] },
  { name: 'Antalya', lat: 36.8969, lng: 30.7133, districts: ['Kaş', 'Kalkan', 'Manavgat', 'Serik', 'Alanya', 'Kemer', 'Demre', 'Kumluca'] },
  { name: 'Muğla', lat: 37.2154, lng: 28.3636, districts: ['Bodrum', 'Fethiye', 'Marmaris', 'Datça', 'Milas', 'Köyceğiz', 'Dalaman'] },
  { name: 'Bursa', lat: 40.1885, lng: 29.0610, districts: ['İznik', 'Mudanya', 'Orhangazi', 'Gemlik', 'Yenişehir', 'Karacabey'] },
  { name: 'Balıkesir', lat: 39.6484, lng: 27.8826, districts: ['Edremit', 'Ayvalık', 'Burhaniye', 'Erdek', 'Gönen', 'Bandırma'] },
  { name: 'Kocaeli', lat: 40.8533, lng: 29.8815, districts: ['İzmit', 'Kandıra', 'Gebze', 'Karamürsel'] },
  { name: 'Aydın', lat: 37.8480, lng: 27.8456, districts: ['Kuşadası', 'Didim', 'Söke', 'Çine', 'Nazilli'] },
  { name: 'Çanakkale', lat: 40.1553, lng: 26.4142, districts: ['Bozcaada', 'Gökçeada', 'Bayramiç', 'Ezine', 'Lapseki'] },
  { name: 'Tekirdağ', lat: 40.9833, lng: 27.5167, districts: ['Marmaraereğlisi', 'Şarköy', 'Saray', 'Çorlu'] },
  { name: 'Sakarya', lat: 40.7569, lng: 30.3781, districts: ['Adapazarı', 'Sapanca', 'Karasu', 'Hendek', 'Akyazı'] },
  { name: 'Yalova', lat: 40.6500, lng: 29.2667, districts: ['Çınarcık', 'Termal', 'Armutlu'] },
  { name: 'Trabzon', lat: 41.0015, lng: 39.7178, districts: ['Sürmene', 'Of', 'Akçaabat', 'Maçka'] },
  { name: 'Eskişehir', lat: 39.7767, lng: 30.5206, districts: ['Sivrihisar', 'Çifteler', 'Mihalıççık'] },
  { name: 'Konya', lat: 37.8746, lng: 32.4932, districts: ['Akşehir', 'Beyşehir', 'Cihanbeyli', 'Karatay', 'Selçuklu'] },
  { name: 'Mersin', lat: 36.8000, lng: 34.6333, districts: ['Anamur', 'Erdemli', 'Silifke', 'Tarsus'] },
  { name: 'Edirne', lat: 41.6818, lng: 26.5623, districts: ['Keşan', 'İpsala', 'Enez', 'Uzunköprü'] },
  { name: 'Manisa', lat: 38.6191, lng: 27.4289, districts: ['Akhisar', 'Salihli', 'Turgutlu', 'Demirci'] },
  { name: 'Denizli', lat: 37.7765, lng: 29.0864, districts: ['Pamukkale', 'Tavas', 'Buldan', 'Sarayköy'] },
  { name: 'Samsun', lat: 41.2867, lng: 36.3300, districts: ['Atakum', 'Bafra', 'Çarşamba'] },
  { name: 'Hatay', lat: 36.4018, lng: 36.3498, districts: ['Antakya', 'İskenderun', 'Samandağ'] },
];
