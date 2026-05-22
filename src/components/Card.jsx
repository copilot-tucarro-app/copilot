export default function Card({ children, className = "", as: Component = "div" }) {
  return (
    <Component
      className={`rounded-3xl border border-white/80 bg-white/90 shadow-soft shadow-slate-200/60 backdrop-blur transition duration-200 ${className}`}
    >
      {children}
    </Component>
  );
}
