import { Badge } from "@/components/ui/badge";
import { STUDENT_CSV_FIELDS } from "@/features/students/constants";

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
            <span className="text-xs text-muted-foreground">
              (columna {index + 1})
            </span>
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

      <p className="text-xs text-muted-foreground">
        No incluyas una fila de encabezado en los datos: pega únicamente filas
        de estudiantes respetando el orden de columnas indicado arriba.
      </p>
    </div>
  );
}
