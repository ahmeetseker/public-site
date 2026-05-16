import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface FavoritePoint {
  date: string;
  favoriteCount: number;
  priceChange: number;
}

interface CityBucket {
  city: string;
  count: number;
}

const TREND: FavoritePoint[] = [
  { date: '01 May', favoriteCount: 4, priceChange: 0 },
  { date: '03 May', favoriteCount: 5, priceChange: -2.1 },
  { date: '05 May', favoriteCount: 7, priceChange: -2.1 },
  { date: '07 May', favoriteCount: 7, priceChange: -3.4 },
  { date: '09 May', favoriteCount: 8, priceChange: -3.4 },
  { date: '11 May', favoriteCount: 9, priceChange: -3.4 },
  { date: '13 May', favoriteCount: 11, priceChange: -4.8 },
  { date: '15 May', favoriteCount: 12, priceChange: -4.8 },
];

const CITY_DIST: CityBucket[] = [
  { city: 'İstanbul', count: 4 },
  { city: 'Muğla', count: 3 },
  { city: 'Antalya', count: 2 },
  { city: 'İzmir', count: 2 },
  { city: 'Aydın', count: 1 },
];

export default function FavoritesTrends() {
  const totalDiff = useMemo(
    () => TREND[TREND.length - 1].favoriteCount - TREND[0].favoriteCount,
    [],
  );
  const priceDiff = TREND[TREND.length - 1].priceChange;

  return (
    <section className="mt-8 space-y-6 border-t border-dashed border-border pt-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            FAVORİ TREND ANALİZİ
          </div>
          <h2 className="mt-1 font-serif text-xl font-normal tracking-tight">
            Favori <em className="italic font-normal">eğilimi</em> · son 2 hafta
          </h2>
        </div>
        <div className="flex gap-4 text-sm">
          <span>
            Favori büyüme:{' '}
            <strong className={totalDiff > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}>
              {totalDiff > 0 ? '+' : ''}
              {totalDiff}
            </strong>
          </span>
          <span>
            Ortalama fiyat değ.:{' '}
            <strong className={priceDiff < 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
              {priceDiff > 0 ? '+' : ''}
              {priceDiff}%
            </strong>
          </span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Favori sayısı · fiyat değişimi</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="favoriteCount"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Favori sayısı"
                />
                <Line
                  type="monotone"
                  dataKey="priceChange"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ r: 2 }}
                  name="Fiyat değ. (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Şehir dağılımı</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CITY_DIST} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="city" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {CITY_DIST.map((_, i) => (
                    <Cell key={i} fill="hsl(var(--foreground))" fillOpacity={0.7 + (i % 3) * 0.1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
