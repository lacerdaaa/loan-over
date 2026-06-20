import { AlertTriangle, PartyPopper } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { ProjectionChart } from '../components/ui/ProjectionChart';
import { useProjection } from '../api/projection';

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR = now.getFullYear();

export const TimelinePage = () => {
  const { data, isLoading } = useProjection(MONTH, YEAR, 24);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full">
        <div>
          <h1 className="text-2xl font-bold text-base-content">24-Month Projection</h1>
          <p className="text-base-content/50 text-sm mt-0.5">Future cash flow based on current debts and income</p>
        </div>

        <div className="card bg-base-200 border border-base-300 p-5">
          {isLoading ? (
            <div className="h-64 animate-pulse bg-base-300 rounded-lg" />
          ) : data ? (
            <ProjectionChart data={data} />
          ) : null}
        </div>

        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.filter((m) => m.events.length > 0).map((m) =>
              m.events.map((e, i) => (
                <div
                  key={`${m.month}-${m.year}-${i}`}
                  className={`card border p-4 text-sm ${e.type === 'liberation' ? 'bg-success/5 border-success/30' : 'bg-warning/5 border-warning/30'}`}
                >
                  <p className={`font-semibold flex items-center gap-2 ${e.type === 'liberation' ? 'text-success' : 'text-warning'}`}>
                    {e.type === 'liberation' ? <PartyPopper size={15} /> : <AlertTriangle size={15} />}
                    {new Date(m.year, m.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-base-content/70 mt-0.5">{e.description}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
};
