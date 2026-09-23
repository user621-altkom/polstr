'use client';

import { useState } from 'react';

type TypRaty = 'rowne' | 'malejace';
type Wskaznik = 'POLSTR_1M' | 'WIBOR_3M';
type EfektNadplaty = 'rata' | 'okres';

type NadplataInput = {
  id: number;
  nrRaty: number;
  kwota: number;
  efekt: EfektNadplaty;
};

type FormState = {
  kwota: number;
  liczbaRat: number;
  marza: number;
  typRaty: TypRaty;
  wskaznik: Wskaznik;
  pierwszaRata: string;
  nadplaty: NadplataInput[];
};

type WierszHarmonogramu = {
  nr: number;
  data: string;
  oprocentowanie: number;
  kapital: number;
  odsetki: number;
  rata: number;
  saldo: number;
  nadplata: number;
};

type HarmonogramResponse = {
  op: {
    kwota: number;
    liczbaRat: number;
    marza: number;
    typRaty: TypRaty;
    wskaznik: Wskaznik;
    pierwszaRata: string;
    nadplaty: { nrRaty: number; kwota: number; efekt: EfektNadplaty }[];
  };
  oprocentowanie: number;
  rataPierwsza: number;
  rataOstatnia: number;
  sumaOdsetek: number;
  sumaKapitalu: number;
  sumaNadplat: number;
  harmonogram: WierszHarmonogramu[];
};

type OdpowiedzBledu = { blad?: string };

const defaultForm: FormState = {
  kwota: 400000,
  liczbaRat: 300,
  marza: 2.11,
  typRaty: 'rowne',
  wskaznik: 'POLSTR_1M',
  pierwszaRata: '2026-10-01',
  nadplaty: [],
};

const formatMoney = (value: number, digits = 2) =>
  new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

const formatDate = (iso: string) => iso.split('-').reverse().join('.');

const toQueryString = (form: FormState) => {
  const params = new URLSearchParams({
    kwota: String(form.kwota),
    liczbaRat: String(form.liczbaRat),
    marza: String(form.marza),
    typRat: form.typRaty,
    wskaznik: form.wskaznik,
    pierwszaRata: form.pierwszaRata,
  });

  form.nadplaty.forEach((nadplata, index) => {
    params.append(`nadplata[${index}][nrRaty]`, String(nadplata.nrRaty));
    params.append(`nadplata[${index}][kwota]`, String(nadplata.kwota));
    params.append(`nadplata[${index}][efekt]`, nadplata.efekt);
  });

  return params.toString();
};

const csvValue = (value: number) => formatMoney(value).replace(/\u00a0/g, ' ');

export default function Strona() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<HarmonogramResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setNadplata = (id: number, patch: Partial<NadplataInput>) => {
    setForm((current) => ({
      ...current,
      nadplaty: current.nadplaty.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/harmonogram?${toQueryString(form)}`);
      const data = (await response.json()) as HarmonogramResponse & OdpowiedzBledu;
      if (!response.ok) {
        throw new Error(data.blad ?? `API zwróciło błąd ${response.status}`);
      }
      setResult(data);
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : 'Błąd pobierania danych');
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadData();
  };

  const exportCsv = () => {
    if (!result) return;

    const csv = [
      'Nr;Data;Oprocentowanie;Kapitał;Odsetki;Rata;Saldo;Nadpłata',
      ...result.harmonogram.map((item) => [
        item.nr,
        formatDate(item.data),
        `${formatMoney(item.oprocentowanie)}%`,
        csvValue(item.kapital),
        csvValue(item.odsetki),
        csvValue(item.rata),
        csvValue(item.saldo),
        csvValue(item.nadplata),
      ].join(';')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'harmonogram.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Kalkulator kredytu</p>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Harmonogram na POLSTR / WIBOR</h1>
            </div>
            <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">MVP</div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Parametry kredytu</h2>
              <button type="button" onClick={() => { setForm(defaultForm); setResult(null); setError(null); }} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Wyczyść</button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Kwota kredytu
                <input type="number" min="0.01" step="0.01" value={form.kwota} onChange={(event) => updateField('kwota', Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Liczba rat
                <input type="number" min="1" step="1" value={form.liczbaRat} onChange={(event) => updateField('liczbaRat', Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Data pierwszej raty
                <input type="date" value={form.pierwszaRata} onChange={(event) => updateField('pierwszaRata', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Marża banku
                <input type="number" min="0" step="0.01" value={form.marza} onChange={(event) => updateField('marza', Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white" />
              </label>

              <fieldset>
                <legend className="mb-1 text-sm font-medium text-slate-700">Typ raty</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(['rowne', 'malejace'] as TypRaty[]).map((type) => <button key={type} type="button" onClick={() => updateField('typRaty', type)} className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${form.typRaty === type ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>{type === 'rowne' ? 'Równe' : 'Malejące'}</button>)}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-1 text-sm font-medium text-slate-700">Wskaźnik</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(['POLSTR_1M', 'WIBOR_3M'] as Wskaznik[]).map((type) => <button key={type} type="button" onClick={() => updateField('wskaznik', type)} className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${form.wskaznik === type ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>{type === 'POLSTR_1M' ? 'POLSTR 1M' : 'WIBOR 3M'}</button>)}
                </div>
              </fieldset>

              <div>
                <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-slate-700">Nadpłaty</span><button type="button" onClick={() => setForm((current) => ({ ...current, nadplaty: [...current.nadplaty, { id: Math.max(0, ...current.nadplaty.map((item) => item.id)) + 1, nrRaty: Math.min(current.liczbaRat, 12), kwota: 20000, efekt: 'rata' }] }))} className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100">+ Dodaj</button></div>
                <div className="space-y-2">
                  {form.nadplaty.map((nadplata) => <div key={nadplata.id} className="grid grid-cols-[80px_1fr_120px_40px] gap-2"><input aria-label="Numer raty nadpłaty" type="number" min="1" value={nadplata.nrRaty} onChange={(event) => setNadplata(nadplata.id, { nrRaty: Number(event.target.value) })} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm" /><input aria-label="Kwota nadpłaty" type="number" min="0.01" step="0.01" value={nadplata.kwota} onChange={(event) => setNadplata(nadplata.id, { kwota: Number(event.target.value) })} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm" /><select aria-label="Efekt nadpłaty" value={nadplata.efekt} onChange={(event) => setNadplata(nadplata.id, { efekt: event.target.value as EfektNadplaty })} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm"><option value="rata">Obniż ratę</option><option value="okres">Skróć okres</option></select><button type="button" aria-label="Usuń nadpłatę" onClick={() => setForm((current) => ({ ...current, nadplaty: current.nadplaty.filter((item) => item.id !== nadplata.id) }))} className="rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100">×</button></div>)}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="mt-5 w-full rounded-xl bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400">{loading ? 'Liczenie...' : 'Policz'}</button>
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
          </form>

          <section className="space-y-5">
            {result ? <>
              <div className="grid gap-4 md:grid-cols-4">
                {[['Rata pierwsza', result.rataPierwsza], ['Rata ostatnia', result.rataOstatnia], ['Suma odsetek', result.sumaOdsetek], ['Oprocentowanie', result.oprocentowanie]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-slate-900">{formatMoney(Number(value))}{label === 'Oprocentowanie' ? '%' : ''}</p><p className="mt-1 text-sm text-slate-500">{label === 'Oprocentowanie' ? 'po marży' : 'zł'}</p></div>)}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-slate-900">Harmonogram spłaty</h2><button type="button" onClick={exportCsv} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Eksport CSV</button></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{['Nr', 'Data', 'Oprocentowanie', 'Kapitał', 'Odsetki', 'Rata', 'Saldo', 'Nadpłata'].map((header) => <th key={header} className="whitespace-nowrap px-3 py-2 font-medium">{header}</th>)}</tr></thead><tbody>{result.harmonogram.map((item) => <tr key={item.nr} className="border-t border-slate-200"><td className="px-3 py-2">{item.nr}</td><td className="whitespace-nowrap px-3 py-2">{formatDate(item.data)}</td><td className="px-3 py-2">{formatMoney(item.oprocentowanie)}%</td><td className="px-3 py-2">{formatMoney(item.kapital)}</td><td className="px-3 py-2">{formatMoney(item.odsetki)}</td><td className="px-3 py-2 font-medium">{formatMoney(item.rata)}</td><td className="px-3 py-2">{formatMoney(item.saldo)}</td><td className="px-3 py-2">{formatMoney(item.nadplata)}</td></tr>)}</tbody></table></div></div>
+            </> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">Wprowadź parametry i wybierz „Policz”, aby zobaczyć harmonogram.</div>}
+          </section>
+        </div>
+      </div>
+    </main>
  );
}
