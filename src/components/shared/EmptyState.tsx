import { Sparkles } from "lucide-react";

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-48 place-content-center justify-items-center px-4 py-8 text-center text-slate-500">
      <Sparkles className="mb-2 size-6 text-sky-500" />
      <b className="text-sm font-black text-slate-950">{title}</b>
      <p className="mt-1 max-w-72 text-sm leading-6">{detail}</p>
    </div>
  );
}
