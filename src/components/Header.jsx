import { LogOut, UserRound } from "lucide-react";
import { APP_ICON_URL, APP_NAME } from "../config/appConfig";

export default function Header({ user, title, subtitle, onLogout, action, backAction }) {
  const headerTitle = title || `Hola, ${user?.name || "conductor"}`;

  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-3">
          {backAction ? <div className="shrink-0">{backAction}</div> : null}
          <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-950 shadow-sm ring-1 ring-slate-900/10" role="img" aria-label={APP_NAME} title={APP_NAME}>
            <img src={APP_ICON_URL} alt="" className="h-full w-full object-cover" />
          </div>
          <h1 className="min-w-0 flex-1 truncate text-xl font-black leading-tight text-slate-950 sm:text-2xl">{headerTitle}</h1>
        </div>
        {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
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
