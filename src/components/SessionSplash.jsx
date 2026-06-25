import { APP_LOGIN_LOGO_URL, APP_NAME } from "../config/appConfig";

export default function SessionSplash({ visible }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9998] grid min-w-80 place-items-center bg-slate-950" role="status" aria-label={`Cargando ${APP_NAME}`}>
      <div className="flex flex-col items-center gap-5">
        <img src={APP_LOGIN_LOGO_URL} alt={APP_NAME} className="block h-auto w-[min(66vw,15rem)]" />
        <div className="size-8 animate-spin rounded-full border-[0.2rem] border-white/30 border-t-white" aria-hidden="true" />
      </div>
    </div>
  );
}
