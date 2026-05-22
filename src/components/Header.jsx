import { LogOut, UserRound } from "lucide-react";
import { APP_ICON_URL, APP_NAME } from "../config/appConfig";

export default function Header({ user, title, subtitle, onLogout, action }) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-blue-100">
          <img src={APP_ICON_URL} alt="" className="size-5 rounded-full object-cover" />
          {APP_NAME}
        </div>
        <h1 className="text-2xl font-black leading-tight text-slate-950">{title || `Hola, ${user?.name || "conductor"}`}</h1>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {action}
        {user ? (
          <button
            type="button"
            onClick={onLogout}
            className="grid size-11 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-red-600"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={19} />
          </button>
        ) : (
          <div className="grid size-11 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
            <UserRound size={19} />
          </div>
        )}
      </div>
    </header>
  );
}
