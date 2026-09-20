import { Badge } from "@/components/ui/badge";
import type { ReportCard } from "@/features/reports/types";

function displayAverage(value: number | null): string {
  return value === null ? "No disponible" : value.toFixed(2);
}

export function ReportCardTable({ reportCard }: { reportCard: ReportCard }) {
  const terms = reportCard.subjects[0]?.terms ?? [];
  if (reportCard.subjects.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No hay materias ni calificaciones registradas para este período.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[680px] text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Materia</th>
            {terms.map((term) => (
              <th key={term.id} className="px-4 py-3 font-medium">
                {term.name}
              </th>
            ))}
            <th className="px-4 py-3 font-medium">Promedio</th>
            <th className="px-4 py-3 font-medium">Escala</th>
          </tr>
        </thead>
        <tbody>
          {reportCard.subjects.map((subject) => (
            <tr key={subject.id} className="border-t border-border">
              <td className="px-4 py-3 font-medium">
                <div>{subject.name}</div>
                {subject.code ? (
                  <span className="text-xs text-muted-foreground">
                    {subject.code}
                  </span>
                ) : null}
              </td>
              {subject.terms.map((term) => (
                <td key={term.id} className="px-4 py-3">
                  {displayAverage(term.average)}
                </td>
              ))}
              <td className="px-4 py-3 font-semibold">
                {displayAverage(subject.average)}
              </td>
              <td className="px-4 py-3">
                {subject.qualitativeResult ? (
                  <Badge
                    variant="secondary"
                    title={subject.qualitativeResult.description}
                  >
                    {subject.qualitativeResult.code}
                  </Badge>
                ) : (
                  "No disponible"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
