import type { TkgmCode, TkgmQuery } from './types';

const ERROR_CODES: TkgmCode[] = ['E001', 'E002', 'E003', 'E099'];

const ERROR_MSGS: Record<TkgmCode, string> = {
  OK: 'İşlem başarılı',
  E001: 'Parsel kaydı bulunamadı',
  E002: 'Geçici kapalı (E002)',
  E003: 'Tetkik gerekli',
  E099: 'Bilinmeyen hata',
};

export async function queryParcel(input: {
  il: string;
  ilce: string;
  ada: string;
  parsel: string;
  userId?: string;
}): Promise<TkgmQuery> {
  const latency = 800 + Math.random() * 2500;
  await new Promise((r) => setTimeout(r, latency));

  const successRoll = Math.random();
  const status: TkgmCode =
    successRoll < 0.75 ? 'OK' : ERROR_CODES[Math.floor(Math.random() * ERROR_CODES.length)];

  return {
    id: `tq-${Date.now().toString(36)}`,
    by: input.userId ?? 'anonymous',
    input: { il: input.il, ilce: input.ilce, ada: input.ada, parsel: input.parsel },
    status,
    latencyMs: Math.round(latency),
    createdAt: new Date().toISOString(),
    result:
      status === 'OK'
        ? {
            il: input.il,
            ilce: input.ilce,
            mahalle: `${input.ilce} Merkez Mahallesi`,
            ada: input.ada,
            parsel: input.parsel,
            yuzolcumu: Math.round(500 + Math.random() * 15_000),
            cinsi: Math.random() > 0.5 ? 'Arsa' : 'Tarla',
            hisse: Math.random() > 0.7 ? '1/2' : undefined,
          }
        : undefined,
  };
}

export function tkgmCodeMessage(code: TkgmCode): string {
  return ERROR_MSGS[code];
}
