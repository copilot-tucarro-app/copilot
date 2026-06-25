import {
  BatteryCharging,
  Calculator as CalculatorIcon,
  Fuel,
  Gauge,
  PiggyBank,
  Route,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import BackToCenterButton from "../components/BackToCenterButton";
import Card from "../components/Card";
import Header from "../components/Header";
import {
  calculateCostPerKm,
  calculateGallons,
  calculateRemainingRange,
  calculateSavings,
  calculateTripCost,
  calculateWeeklyMonthlyCost,
} from "../utils/calculatorUtils";
import { getVehicle } from "../utils/storage";

const formatCurrency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatNumber = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2,
});

const calculatorTabs = [
  { id: "fuelMoney", label: "Gasolina", icon: Fuel },
  { id: "costPerKm", label: "Km", icon: Gauge },
  { id: "trip", label: "Viaje", icon: Route },
  { id: "weekly", label: "Gasto", icon: WalletCards },
  { id: "range", label: "Autonomía", icon: BatteryCharging },
  { id: "savings", label: "Ahorro", icon: PiggyBank },
];

export default function Calculator({ user, onLogout, onNavigate }) {
  const vehicle = getVehicle(user);
  const defaultAutonomy = vehicle?.autonomyPerGallon || "38";
  const [activeCalculator, setActiveCalculator] = useState("fuelMoney");
  const [forms, setForms] = useState({
    fuelMoney: {
      priceGallon: "16000",
      availableMoney: "20000",
    },
    costPerKm: {
      priceGallon: "16000",
      autonomy: defaultAutonomy,
    },
    trip: {
      distance: "25",
      priceGallon: "16000",
      autonomy: defaultAutonomy,
    },
    weekly: {
      dailyKm: "20",
      daysPerWeek: "5",
      priceGallon: "16000",
      autonomy: defaultAutonomy,
    },
    range: {
      currentGallons: "3",
      autonomy: defaultAutonomy,
    },
    savings: {
      monthlyKm: "800",
      priceGallon: "16000",
      currentAutonomy: "32",
      optimizedAutonomy: "42",
    },
  });

  function updateValue(calculatorId, field, value) {
    setForms((current) => ({
      ...current,
      [calculatorId]: {
        ...current[calculatorId],
        [field]: value,
      },
    }));
  }

  return (
    <main className="screen-shell scroll-smooth">
      <Header
        user={user}
        onLogout={onLogout}
        title="Calculadora"
        subtitle="Calcula gastos, gasolina y costos de viaje."
        backAction={<BackToCenterButton onNavigate={onNavigate} />}
      />

      <section className="mb-5 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-soft">
        <div className="relative p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(37,99,235,0.62),transparent_20rem)]" />
          <div className="relative flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-3xl bg-white text-blue-600">
              <CalculatorIcon size={28} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Costos inteligentes</p>
              <h2 className="mt-1 text-xl font-black">Decide con números claros</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">Todo se calcula en tiempo real y queda local en tu dispositivo.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-5 flex gap-2 overflow-x-auto rounded-3xl bg-white/80 p-2 shadow-sm ring-1 ring-slate-200">
        {calculatorTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeCalculator === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveCalculator(tab.id)}
              className={`flex min-w-[6.5rem] items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition duration-200 ${
                active ? "bg-black text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)]" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="transition-all duration-300">
        {activeCalculator === "fuelMoney" ? <FuelMoneyCalculator values={forms.fuelMoney} onChange={updateValue} /> : null}
        {activeCalculator === "costPerKm" ? <CostPerKmCalculator values={forms.costPerKm} onChange={updateValue} /> : null}
        {activeCalculator === "trip" ? <TripCalculator values={forms.trip} onChange={updateValue} /> : null}
        {activeCalculator === "weekly" ? <WeeklyMonthlyCalculator values={forms.weekly} onChange={updateValue} /> : null}
        {activeCalculator === "range" ? <RemainingRangeCalculator values={forms.range} onChange={updateValue} /> : null}
        {activeCalculator === "savings" ? <SavingsCalculator values={forms.savings} onChange={updateValue} /> : null}
      </div>
    </main>
  );
}

function FuelMoneyCalculator({ values, onChange }) {
  const gallons = calculateGallons(values.priceGallon, values.availableMoney);
  return (
    <CalculatorBlock
      icon={Fuel}
      tone="blue"
      title="Gasolina por dinero"
      subtitle="Calcula cuántos galones compras con tu presupuesto."
      result={<ResultHero icon={Fuel} value={`${formatNumber.format(gallons)} galones`} text={`Puedes comprar ${formatNumber.format(gallons)} galones`} tone="blue" />}
    >
      <NumberField label="Precio del galón" value={values.priceGallon} onChange={(value) => onChange("fuelMoney", "priceGallon", value)} />
      <NumberField label="Dinero disponible" value={values.availableMoney} onChange={(value) => onChange("fuelMoney", "availableMoney", value)} />
    </CalculatorBlock>
  );
}

function CostPerKmCalculator({ values, onChange }) {
  const costPerKm = calculateCostPerKm(values.priceGallon, values.autonomy);
  return (
    <CalculatorBlock
      icon={Gauge}
      tone="green"
      title="Costo por kilómetro"
      subtitle="Conoce cuánto cuesta recorrer 1 km."
      result={<ResultHero icon={Gauge} value={formatCurrency.format(costPerKm)} text={`Cada kilómetro te cuesta aproximadamente ${formatCurrency.format(costPerKm)}`} tone="green" />}
    >
      <NumberField label="Precio del galón" value={values.priceGallon} onChange={(value) => onChange("costPerKm", "priceGallon", value)} />
      <NumberField label="Autonomía del vehículo (km por galón)" value={values.autonomy} onChange={(value) => onChange("costPerKm", "autonomy", value)} />
    </CalculatorBlock>
  );
}

function TripCalculator({ values, onChange }) {
  const tripCost = calculateTripCost(values.distance, values.priceGallon, values.autonomy);
  return (
    <CalculatorBlock
      icon={Route}
      tone="yellow"
      title="Costo de viaje"
      subtitle="Estima el valor de un trayecto por distancia."
      result={<ResultHero icon={Route} value={formatCurrency.format(tripCost)} text={`El viaje costará aproximadamente ${formatCurrency.format(tripCost)}`} tone="yellow" />}
    >
      <NumberField label="Distancia en kilómetros" value={values.distance} onChange={(value) => onChange("trip", "distance", value)} />
      <NumberField label="Precio del galón" value={values.priceGallon} onChange={(value) => onChange("trip", "priceGallon", value)} />
      <NumberField label="Autonomía del vehículo" value={values.autonomy} onChange={(value) => onChange("trip", "autonomy", value)} />
    </CalculatorBlock>
  );
}

function WeeklyMonthlyCalculator({ values, onChange }) {
  const result = calculateWeeklyMonthlyCost(values.dailyKm, values.daysPerWeek, values.priceGallon, values.autonomy);
  return (
    <CalculatorBlock icon={WalletCards} tone="blue" title="Gasto semanal y mensual" subtitle="Proyecta tu gasto por rutina de manejo.">
      <NumberField label="Kilómetros recorridos por día" value={values.dailyKm} onChange={(value) => onChange("weekly", "dailyKm", value)} />
      <NumberField label="Días por semana" value={values.daysPerWeek} onChange={(value) => onChange("weekly", "daysPerWeek", value)} />
      <NumberField label="Precio del galón" value={values.priceGallon} onChange={(value) => onChange("weekly", "priceGallon", value)} />
      <NumberField label="Autonomía del vehículo" value={values.autonomy} onChange={(value) => onChange("weekly", "autonomy", value)} />
      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
        <MiniResult title="Gasto semanal" value={formatCurrency.format(result.weeklyCost)} detail={`${formatNumber.format(result.weeklyKm)} km por semana`} tone="blue" />
        <MiniResult title="Gasto mensual" value={formatCurrency.format(result.monthlyCost)} detail="Estimado sobre 4 semanas" tone="green" />
      </div>
    </CalculatorBlock>
  );
}

function RemainingRangeCalculator({ values, onChange }) {
  const range = calculateRemainingRange(values.currentGallons, values.autonomy);
  return (
    <CalculatorBlock
      icon={BatteryCharging}
      tone="green"
      title="Autonomía restante"
      subtitle="Calcula cuántos kilómetros puedes recorrer con el combustible actual."
      result={<ResultHero icon={BatteryCharging} value={`${formatNumber.format(range)} km`} text={`Puedes recorrer aproximadamente ${formatNumber.format(range)} km`} tone="green" />}
    >
      <NumberField label="Galones actuales" value={values.currentGallons} onChange={(value) => onChange("range", "currentGallons", value)} />
      <NumberField label="Autonomía por galón" value={values.autonomy} onChange={(value) => onChange("range", "autonomy", value)} />
    </CalculatorBlock>
  );
}

function SavingsCalculator({ values, onChange }) {
  const result = calculateSavings(values.monthlyKm, values.priceGallon, values.currentAutonomy, values.optimizedAutonomy);
  const positiveSavings = Math.max(result.savings, 0);
  return (
    <CalculatorBlock icon={PiggyBank} tone="green" title="Ahorro potencial" subtitle="Compara tu consumo actual contra un rendimiento optimizado.">
      <NumberField label="Kilómetros mensuales" value={values.monthlyKm} onChange={(value) => onChange("savings", "monthlyKm", value)} />
      <NumberField label="Precio del galón" value={values.priceGallon} onChange={(value) => onChange("savings", "priceGallon", value)} />
      <NumberField label="Autonomía actual" value={values.currentAutonomy} onChange={(value) => onChange("savings", "currentAutonomy", value)} />
      <NumberField label="Autonomía optimizada" value={values.optimizedAutonomy} onChange={(value) => onChange("savings", "optimizedAutonomy", value)} />
      <div className="grid gap-3 sm:col-span-2">
        <ResultHero
          icon={PiggyBank}
          value={formatCurrency.format(positiveSavings)}
          text={result.savings >= 0 ? `Podrías ahorrar ${formatCurrency.format(result.savings)} mensuales` : "La autonomía optimizada debe ser mayor para generar ahorro"}
          tone="green"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniResult title="Gasto actual" value={formatCurrency.format(result.currentCost)} detail="Con tu autonomía actual" tone="yellow" />
          <MiniResult title="Gasto optimizado" value={formatCurrency.format(result.optimizedCost)} detail="Con mejor rendimiento" tone="green" />
        </div>
      </div>
    </CalculatorBlock>
  );
}

function CalculatorBlock({ icon: Icon, tone, title, subtitle, result, children }) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    yellow: "bg-amber-50 text-amber-600",
  };

  return (
    <Card className="p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${toneClasses[tone] || toneClasses.blue}`}>
          <Icon size={23} />
        </div>
        <div>
          <h2 className="text-xl font-black leading-tight text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>
      </div>

      {result ? <div className="mb-4">{result}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      <input className="input" value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" placeholder="0" />
    </label>
  );
}

function ResultHero({ icon: Icon, value, text, tone }) {
  const styles = {
    blue: "from-blue-600 to-sky-500",
    green: "from-emerald-600 to-green-500",
    yellow: "from-amber-500 to-yellow-400",
  };

  return (
    <div className={`rounded-[1.75rem] bg-gradient-to-br ${styles[tone] || styles.blue} p-5 text-white shadow-lift transition duration-300`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-white/20">
          <Icon size={24} />
        </div>
        <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-black">Resultado</span>
      </div>
      <p className="text-3xl font-black leading-tight">{value}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-white/88">{text}</p>
    </div>
  );
}

function MiniResult({ title, value, detail, tone }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    yellow: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <div className={`rounded-3xl p-4 ring-1 transition duration-300 ${colors[tone] || colors.blue}`}>
      <p className="text-sm font-black">{title}</p>
      <p className="mt-2 text-2xl font-black leading-tight">{value}</p>
      <p className="mt-1 text-xs font-semibold opacity-80">{detail}</p>
    </div>
  );
}
