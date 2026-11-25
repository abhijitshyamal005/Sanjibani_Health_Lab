function Bar({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />;
}

export function LabCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="h-32 animate-pulse bg-slate-200/70" />
      <div className="space-y-3 p-4">
        <Bar className="h-4 w-2/3" />
        <Bar className="h-3 w-1/2" />
        <div className="flex gap-2"><Bar className="h-5 w-14" /><Bar className="h-5 w-20" /></div>
        <Bar className="h-3 w-full" />
      </div>
    </div>
  );
}

export function OfferSkeleton() {
  return (
    <div className="card flex items-center gap-4 p-4" aria-hidden="true">
      <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200/80" />
      <div className="flex-1 space-y-2"><Bar className="h-3 w-1/4" /><Bar className="h-4 w-1/2" /><Bar className="h-3 w-2/3" /></div>
      <Bar className="h-9 w-20" />
    </div>
  );
}
