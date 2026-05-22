import { Badge } from "@/components/ui/badge";
import {
  STUDENT_CSV_FIELDS,
  STUDENT_CSV_HEADER_LINE,
} from "@/features/students/constants";

export function CsvFormatSpec() {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          Orden de columnas (igual que el formulario de alta)
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Cada fila termina en punto y coma (<code>;</code>). Los campos opcionales
          pueden dejarse vacíos, pero deben conservar su posición (comas vacías).
        </p>
      </div>

      <ol className="space-y-2 text-sm">
        {STUDENT_CSV_FIELDS.map((field, index) => (
          <li key={field.key} className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {index + 1}.
            </span>
            <span className="font-medium">{field.label}</span>
            <code className="rounded bg-background px-1.5 py-0.5 text-xs">
              {field.key}
            </code>
            {field.required ? (
              <Badge variant="secondary" className="text-xs">
                Obligatorio
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Opcional
              </Badge>
            )}
            {"hint" in field && field.hint ? (
              <span className="w-full text-xs text-muted-foreground">
                {field.hint}
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">
          Línea de encabezado (opcional, no pegarla dentro de datos con comas
          extra)
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs">
          {STUDENT_CSV_HEADER_LINE}
        </pre>
      </div>
    </div>
  );
}
