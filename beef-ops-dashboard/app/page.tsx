'use client';
import React, { useMemo, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Slider } from "../components/ui/slider";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, ArrowDownRight, Gauge, Store, Sparkles, TrendingUp } from "lucide-react";

const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const kpiCard = (
  {
    title,
    value,
    delta,
    good=true,
    icon,
  }: {title: string; value: string; delta?: string; good?: boolean; icon?: React.ReactNode}
) => (
  <Card className="rounded-2xl shadow-sm border-muted p-4">
    <CardContent className="p-0 flex items-center gap-4">
      <div className="rounded-xl p-3 bg-muted flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {delta && (
          <div className={`text-xs mt-1 flex items-center gap-1 ${good ? "text-emerald-600" : "text-rose-600"}`}>
            {good ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
            {delta}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function BeefOpsDemoDashboard() {
  const [kgYear, setKgYear] = useState<number>(6_100_000);
  const [priceKg, setPriceKg] = useState<number>(400);
  const [baseWaste, setBaseWaste] = useState<number>(10);
  const [cutWastePP, setCutWastePP] = useState<number>(1.0);
  const [nearExpiryFactor, setNearExpiryFactor] = useState<number>(0.8);
  const [seasonalShare, setSeasonalShare] = useState<number>(0.30);
  const [upliftPct, setUpliftPct] = useState<number>(0.015);
  const [retention, setRetention] = useState<number>(0.95);

  const macro = useMemo(() => {
    const soldKg = kgYear * (1 - baseWaste/100);
    const baselineRev = soldKg * priceKg;
    const recoveredKg = kgYear * (cutWastePP/100);
    const recoveredMXN = recoveredKg * priceKg * nearExpiryFactor;
    const seasonalRev = baselineRev * seasonalShare;
    const pricingMXN = seasonalRev * upliftPct * retention;
    const totalImpact = recoveredMXN + pricingMXN;
    return { soldKg, baselineRev, recoveredKg, recoveredMXN, seasonalRev, pricingMXN, totalImpact };
  }, [kgYear, priceKg, baseWaste, cutWastePP, nearExpiryFactor, seasonalShare, upliftPct, retention]);

  const mkt = useMemo(() => {
    const weeks = ["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6","Sem 7","Sem 8"];
    const waArr = [120, 150, 165, 180, 210, 230, 205, 260];
    const emArr = [200, 215, 225, 240, 255, 270, 245, 280];
    const buys  = [35, 40, 44, 50, 62, 68, 58, 78];
    const rows = weeks.map((w,i)=>{
      const wa = waArr[i];
      const email = emArr[i];
      const interactions = wa + email;
      const purchases = buys[i];
      const convPct = +(purchases / interactions * 100).toFixed(1);
      return { week:w, wa, email, interactions, purchases, convPct };
    });
    const totals = rows.reduce((a,r)=>({
      interactions:a.interactions + r.interactions,
      purchases:a.purchases + r.purchases
    }), {interactions:0, purchases:0});
    const campaignConv = totals.interactions>0 ? +(totals.purchases / totals.interactions * 100).toFixed(1) : 0;
    const prevCampaignConv = 11.0;
    const deltaPP = +(campaignConv - prevCampaignConv).toFixed(1);
    return { rows, campaignConv, prevCampaignConv, deltaPP };
  }, []);

  const upsellStacks = useMemo(() => {
    const sf = (i:number) => (i===2 || i===3) ? 1.10 : (i===10 || i===11 ? 1.25 : 1.0);
    const noise = (i:number) => 1 + ((((i*7)%5)-2)/100);

    const storeRate = 0.08;
    const webRate = 0.12;
    const storeAvg = 8_000_000;
    const webAvg = 3_000_000;

    const stores = months.map((m, i) => {
      const base = storeAvg * sf(i) * noise(i);
      const upsell = base * storeRate;
      return { mes: m, base, upsell };
    });
    const web = months.map((m, i) => {
      const base = webAvg * sf(i) * noise(i);
      const upsell = base * webRate;
      return { mes: m, base, upsell };
    });

    const sum = (arr: any[], key: 'base'|'upsell') => arr.reduce((a, r) => a + r[key], 0);

    const storeBaseTotal = sum(stores, 'base');
    const storeUpsellTotal = sum(stores, 'upsell');
    const storeLift = storeBaseTotal > 0 ? +(storeUpsellTotal / storeBaseTotal * 100).toFixed(1) : 0;

    const webBaseTotal = sum(web, 'base');
    const webUpsellTotal = sum(web, 'upsell');
    const webLift = webBaseTotal > 0 ? +(webUpsellTotal / webBaseTotal * 100).toFixed(1) : 0;

    return {
      stores, web,
      storeBaseTotal, storeUpsellTotal, storeLift,
      webBaseTotal, webUpsellTotal, webLift,
    };
  }, []);

  const fmtMX = (n:number) => `MX$ ${Math.round(n).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-background text-foreground p-0">
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="min-h-[80vh] px-6 py-6 flex flex-col justify-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Beef Ops ROI Dashboard</h1>
          </div>

          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-4">
              <div className="text-sm text-muted-foreground">Modo macro</div>
              <div className="text-lg font-semibold">Supuestos y ROI</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Kg por ano</div>
                  <Slider defaultValue={[kgYear]} min={1_000_000} max={12_000_000} step={100_000} onValueChange={(v)=> setKgYear(v[0])}/>
                  <div className="text-sm mt-1">{kgYear.toLocaleString()} kg</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Precio por kg (MX$)</div>
                  <Slider defaultValue={[priceKg]} min={200} max={1000} step={10} onValueChange={(v)=> setPriceKg(v[0])}/>
                  <div className="text-sm mt-1">MX$ {priceKg.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Merma base (%)</div>
                  <Slider defaultValue={[baseWaste]} min={5} max={15} step={0.5} onValueChange={(v)=> setBaseWaste(v[0])}/>
                  <div className="text-sm mt-1">{baseWaste.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Recorte merma (p.p.)</div>
                  <Slider defaultValue={[cutWastePP]} min={0} max={3} step={0.1} onValueChange={(v)=> setCutWastePP(v[0])}/>
                  <div className="text-sm mt-1">{cutWastePP.toFixed(1)} p.p.</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Factor precio near-expiry</div>
                  <Slider defaultValue={[nearExpiryFactor]} min={0.6} max={0.9} step={0.05} onValueChange={(v)=> setNearExpiryFactor(v[0])}/>
                  <div className="text-sm mt-1">x {nearExpiryFactor.toFixed(2)} del PVP</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Share estacional de ventas</div>
                  <Slider defaultValue={[seasonalShare]} min={0.1} max={0.5} step={0.05} onValueChange={(v)=> setSeasonalShare(v[0])}/>
                  <div className="text-sm mt-1">{Math.round(seasonalShare*100)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Uplift de precio en temporada</div>
                  <Slider defaultValue={[upliftPct]} min={0} max={0.03} step={0.005} onValueChange={(v)=> setUpliftPct(v[0])}/>
                  <div className="text-sm mt-1">{(upliftPct*100).toFixed(1)}%</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Retencion de volumen</div>
                  <Slider defaultValue={[retention]} min={0.9} max={1.0} step={0.01} onValueChange={(v)=> setRetention(v[0])}/>
                  <div className="text-sm mt-1">{Math.round(retention*100)}%</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCard({ title: "Ventas baseline", value: `MX$ ${Math.round(macro.baselineRev).toLocaleString()}`, icon: <Store className="w-5 h-5"/> })}
                {kpiCard({ title: "Recuperado por merma", value: `MX$ ${Math.round(macro.recoveredMXN).toLocaleString()}`, delta: `${cutWastePP.toFixed(1)} pp`, good:true, icon:<Gauge className="w-5 h-5"/> })}
                {kpiCard({ title: "Incremento por precio", value: `MX$ ${Math.round(macro.pricingMXN).toLocaleString()}`, delta: `${(upliftPct*100).toFixed(1)}%`, good:true, icon:<Sparkles className="w-5 h-5"/> })}
                {kpiCard({ title: "Impacto total", value: `MX$ ${Math.round(macro.totalImpact).toLocaleString()}`, good:true, icon:<TrendingUp className="w-5 h-5"/> })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="min-h-[80vh] px-6 py-6 flex flex-col justify-center gap-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Marketing</div>
                <div className="text-lg font-semibold mb-2">Clics por semana</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={mkt.rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week"/>
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="email" name="Email clics" stroke="#a855f7" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="wa" name="WhatsApp chats" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Marketing</div>
                <div className="text-lg font-semibold mb-2">Conversion a ventas</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={mkt.rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week"/>
                    <YAxis domain={[0,20]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="convPct" name="Conversion %" stroke="#6366f1" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Tasa de conversion (campana)</div>
                <div className="text-5xl font-bold tracking-tight">{mkt.campaignConv}%</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Delta vs campana pasada</div>
                <div className={`text-5xl font-bold tracking-tight ${mkt.deltaPP >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{mkt.deltaPP>=0?'+':''}{mkt.deltaPP} pp</div>
                <div className="text-xs text-muted-foreground mt-1">{mkt.campaignConv}% vs {mkt.prevCampaignConv}%</div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="min-h-[80vh] px-6 py-6 flex flex-col justify-center gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Upsell mensual — Tiendas fisicas (tasa 8%)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={upsellStacks.stores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(v:any)=> fmtMX(Number(v))} />
                    <Legend />
                    <Bar dataKey="base" name="Ventas base" stackId="a" fill="#6366f1" />
                    <Bar dataKey="upsell" name="Upsell" stackId="a" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-4xl font-semibold">{fmtMX(upsellStacks.storeUpsellTotal)}</div>
                  <div className="text-sm text-muted-foreground">Lift vs base: <span className="font-medium">{upsellStacks.storeLift}%</span></div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Upsell mensual — Web (tasa 12%)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={upsellStacks.web}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(v:any)=> fmtMX(Number(v))} />
                    <Legend />
                    <Bar dataKey="base" name="Ventas base" stackId="a" fill="#6366f1" />
                    <Bar dataKey="upsell" name="Upsell" stackId="a" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-4xl font-semibold">{fmtMX(upsellStacks.webUpsellTotal)}</div>
                  <div className="text-sm text-muted-foreground">Lift vs base: <span className="font-medium">{upsellStacks.webLift}%</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="text-[10px] text-muted-foreground pt-2 pb-6 px-6">
          Demo con datos sinteticos y supuestos macro.
        </footer>
      </div>
    </div>
  );
}

