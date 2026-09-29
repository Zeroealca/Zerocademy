"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAcademicEvaluationMutations } from "@/features/academic-evaluation/hooks/use-academic-evaluation";
import type { EvaluationTerm } from "@/features/academic-evaluation/types";

interface EvaluationTermWeightsEditorProps {
  terms: EvaluationTerm[];
  institutionId: string;
  academicPeriodId: string;
  onClose: () => void;
}

function weightsByTerm(terms: EvaluationTerm[]): Record<string, number> {
  return Object.fromEntries(terms.map((term) => [term.id, term.weight]));
}

export function EvaluationTermWeightsEditor({
  terms,
  institutionId,
  academicPeriodId,
  onClose,
}: EvaluationTermWeightsEditorProps) {
  const mutations = useAcademicEvaluationMutations();
  const [weights, setWeights] = useState(() => weightsByTerm(terms));
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setWeights(weightsByTerm(terms));
    setSaveError("");
  }, [terms]);

  const total = useMemo(
    () => terms.reduce((sum, term) => sum + (weights[term.id] ?? 0), 0),
    [terms, weights],
  );
  const hasInvalidWeight = terms.some((term) => {
    const weight = weights[term.id];
    return !Number.isFinite(weight) || weight <= 0 || weight > 100;
  });
  const totalIsValid = Math.abs(total - 100) <= 0.01;
  const canSave = totalIsValid && !hasInvalidWeight && !mutations.updateEvaluationTermWeights.isPending;

  const updateWeight = (id: string, rawValue: string) => {
    const weight = Number(rawValue);
    setWeights((current) => ({ ...current, [id]: weight }));
    setSaveError("");
  };

  const save = async () => {
    if (!canSave) return;

    try {
      await mutations.updateEvaluationTermWeights.mutateAsync({
        institutionId,
        academicPeriodId,
        payload: {
          items: terms.map((term) => ({ id: term.id, weight: weights[term.id] })),
        },
      });
      onClose();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los porcentajes.",
      );
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="font-medium">Editar porcentajes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajusta la distribución completa. Solo se guardará cuando el total sea 100%.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {terms.map((term) => (
          <div key={term.id} className="grid gap-2">
            <Label htmlFor={`term-weight-${term.id}`}>{term.name}</Label>
            <Input
              id={`term-weight-${term.id}`}
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              value={Number.isFinite(weights[term.id]) ? weights[term.id] : ""}
              onChange={(event) => updateWeight(term.id, event.target.value)}
              aria-label={`Peso de ${term.name}`}
            />
          </div>
        ))}
      </div>

      <p className={totalIsValid ? "text-sm text-green-600 dark:text-green-400" : "text-sm text-destructive"}>
        Total: {total.toFixed(2)}% {totalIsValid ? "· distribución válida" : "· debe sumar exactamente 100%"}
      </p>
      {hasInvalidWeight ? (
        <p className="text-sm text-destructive">Cada porcentaje debe ser mayor que 0 y no superar 100.</p>
      ) : null}
      {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}

      <div className="flex gap-2">
        <Button type="button" onClick={() => void save()} disabled={!canSave}>
          {mutations.updateEvaluationTermWeights.isPending
            ? "Guardando…"
            : "Guardar porcentajes"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </section>
  );
}
