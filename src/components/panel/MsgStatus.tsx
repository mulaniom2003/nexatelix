export function MsgStatus({ s }: { s: string }) {
  const k = s.toLowerCase();
  return <span className={`badge b-${k}`}>{k}</span>;
}
