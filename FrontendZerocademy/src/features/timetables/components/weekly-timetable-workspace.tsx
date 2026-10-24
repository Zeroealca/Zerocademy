"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  useTeachingLoads,
  useTimetable,
  useTimetableMutations,
  useTimetableValidation,
  useTimetables,
} from "@/features/timetables/hooks/use-timetables";
import type {
  ScheduleBlock,
  ScheduleStructureDetail,
  TeachingLoad,
  Timetable,
  TimetableConflict,
  TimetableGeneration,
  TimetableSlot,
  TimetableSlotInput,
  Weekday,
} from "@/features/timetables/types";
import { ApiError } from "@/lib/api-error";

const weekdayLabels: Record<Weekday, string> = {
  MON: "Lunes",
  TUE: "Martes",
  WED: "Miércoles",
  THU: "Jueves",
  FRI: "Viernes",
};

const blockKindLabels = {
  BREAK: "Recreo",
  NON_TEACHING: "No lectivo",
  TEACHING: "Clase",
} as const;

type Period = {
  id: string;
  name: string;
  status: "PLANNED" | "ACTIVE" | "CLOSED" | "ARCHIVED";
};

export function WeeklyTimetableWorkspace({
  institutionId,
  period,
  selector,
  structure,
  structureLoading,
  structureError,
}: {
  institutionId: string;
  period: Period;
  selector: ReactNode;
  structure?: ScheduleStructureDetail;
  structureLoading: boolean;
  structureError: unknown;
}) {
  const timetables = useTimetables(institutionId, period.id);
  const teachingLoads = useTeachingLoads(institutionId, period.id);
  const mutations = useTimetableMutations(institutionId, period.id);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>();
  const [candidate, setCandidate] = useState<TimetableGeneration>();
  const [maxSearchNodes, setMaxSearchNodes] = useState("");
  const [generationError, setGenerationError] = useState<unknown>();
  const [confirmation, setConfirmation] = useState<"publish" | "unpublish">();
  const [transitionError, setTransitionError] = useState<unknown>();
  const publishTriggerRef = useRef<HTMLButtonElement>(null);
  const unpublishTriggerRef = useRef<HTMLButtonElement>(null);
  const timetableItems = timetables.data?.data ?? [];
  const timetableId =
    selectedTimetableId &&
    timetableItems.some((item) => item.id === selectedTimetableId)
      ? selectedTimetableId
      : timetableItems[0]?.id;
  const detail = useTimetable(timetableId);
  const validation = useTimetableValidation(timetableId);
  const timetable =
    detail.data ?? timetableItems.find((item) => item.id === timetableId);
  const mutablePeriod =
    period.status === "PLANNED" || period.status === "ACTIVE";
  const structurallyReady = Boolean(structure?.capacity.structurallyReady);
  const parsedLimit = maxSearchNodes ? Number(maxSearchNodes) : undefined;
  const invalidLimit =
    parsedLimit !== undefined &&
    (!Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 1_000_000);
  const generateDisabled =
    !mutablePeriod ||
    !structurallyReady ||
    teachingLoads.isLoading ||
    teachingLoads.isError ||
    invalidLimit ||
    mutations.generate.isPending;

  const generate = async () => {
    if (generateDisabled) return;
    setGenerationError(undefined);
    try {
      const result = await mutations.generate.mutateAsync(parsedLimit);
      setCandidate(result);
    } catch (error) {
      setGenerationError(error);
    }
  };
  const saveCandidate = async () => {
    if (
      !candidate ||
      candidate.status !== "SUCCESS" ||
      !candidate.validation?.valid ||
      mutations.create.isPending
    )
      return;
    const created = await mutations.create.mutateAsync(candidate.slots);
    setSelectedTimetableId(created.id);
    setCandidate(undefined);
  };
  const discardDraft = async () => {
    if (
      !timetable ||
      timetable.status !== "DRAFT" ||
      !window.confirm(
        "¿Descartar este horario en borrador? Esta acción no se puede deshacer.",
      )
    )
      return;
    await mutations.discard.mutateAsync(timetable.id);
    setSelectedTimetableId(undefined);
  };
  const requestPublish = async () => {
    if (!timetable || timetable.status !== "DRAFT") return;
    setTransitionError(undefined);
    const fresh = await validation.refetch();
    if (fresh.error || !fresh.data?.valid) {
      setTransitionError(
        fresh.error ??
          new Error("El horario tiene conflictos que impiden publicarlo."),
      );
      return;
    }
    setConfirmation("publish");
  };
  const confirmTransition = async () => {
    if (!timetable || !confirmation) return;
    setTransitionError(undefined);
    try {
      if (confirmation === "publish")
        await mutations.publish.mutateAsync({
          timetableId: timetable.id,
          expectedVersion: timetable.version,
        });
      else
        await mutations.unpublish.mutateAsync({
          timetableId: timetable.id,
          expectedVersion: timetable.version,
        });
      setConfirmation(undefined);
    } catch (error) {
      setTransitionError(error);
    }
  };
  const transitioning =
    mutations.publish.isPending || mutations.unpublish.isPending;

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Horario semanal
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta la distribución publicada o en borrador sin modificar su
            contenido.
          </p>
        </div>
        {selector}
      </header>

      <GenerationPanel
        period={period}
        structurallyReady={structurallyReady}
        loadsLoading={teachingLoads.isLoading}
        loadsError={teachingLoads.isError ? teachingLoads.error : undefined}
        maxSearchNodes={maxSearchNodes}
        onLimitChange={setMaxSearchNodes}
        invalidLimit={invalidLimit}
        disabled={generateDisabled}
        generating={mutations.generate.isPending}
        error={generationError ?? mutations.generate.error}
        onGenerate={() => void generate()}
      />

      {candidate ? (
        <CandidatePreview
          candidate={candidate}
          structure={structure}
          loads={teachingLoads.data?.data ?? []}
          hasExistingTimetable={timetableItems.length > 0}
          saving={mutations.create.isPending}
          saveError={mutations.create.error}
          onSave={() => void saveCandidate()}
          onDiscard={() => setCandidate(undefined)}
        />
      ) : null}

      {timetables.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Cargando los horarios del período…
        </p>
      ) : null}
      {timetables.isError ? <ReadError error={timetables.error} /> : null}
      {!timetables.isLoading &&
      !timetables.isError &&
      timetableItems.length === 0 ? (
        <EmptyTimetable />
      ) : null}

      {timetableItems.length > 1 ? (
        <div className="max-w-sm">
          <Label htmlFor="weekly-timetable">Horario disponible</Label>
          <Select
            id="weekly-timetable"
            value={timetableId}
            onChange={(event) => setSelectedTimetableId(event.target.value)}
          >
            {timetableItems.map((item) => (
              <option key={item.id} value={item.id}>
                Versión {item.version} · {statusLabel(item.status)}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {timetable ? (
        <TimetableContent
          timetable={timetable}
          structure={structure}
          structureLoading={structureLoading}
          structureError={structureError}
          validation={validation.data}
          validationLoading={validation.isLoading}
          validationError={validation.error}
          teachingLoads={teachingLoads.data?.data ?? []}
          editable={mutablePeriod && timetable.status === "DRAFT"}
          onRevalidate={
            timetable.status === "DRAFT"
              ? () => void validation.refetch()
              : undefined
          }
          onDiscard={
            timetable.status === "DRAFT" ? () => void discardDraft() : undefined
          }
          onPublish={
            mutablePeriod && timetable.status === "DRAFT"
              ? () => void requestPublish()
              : undefined
          }
          publishTriggerRef={publishTriggerRef}
          onUnpublish={
            mutablePeriod && timetable.status === "PUBLISHED"
              ? () => setConfirmation("unpublish")
              : undefined
          }
          unpublishTriggerRef={unpublishTriggerRef}
          publishing={validation.isFetching || transitioning}
          onReplace={(slots) =>
            mutations.replace.mutateAsync({
              timetableId: timetable.id,
              expectedVersion: timetable.version,
              slots,
            })
          }
          replacing={mutations.replace.isPending}
          discarding={mutations.discard.isPending}
          discardError={mutations.discard.error}
        />
      ) : null}
      {transitionError ? <ReadError error={transitionError} /> : null}
      <TransitionConfirmation
        action={confirmation}
        pending={transitioning}
        publishTriggerRef={publishTriggerRef}
        unpublishTriggerRef={unpublishTriggerRef}
        onCancel={() => setConfirmation(undefined)}
        onConfirm={() => void confirmTransition()}
      />
    </div>
  );
}

function GenerationPanel({
  period,
  structurallyReady,
  loadsLoading,
  loadsError,
  maxSearchNodes,
  onLimitChange,
  invalidLimit,
  disabled,
  generating,
  error,
  onGenerate,
}: {
  period: Period;
  structurallyReady: boolean;
  loadsLoading: boolean;
  loadsError?: unknown;
  maxSearchNodes: string;
  onLimitChange: (value: string) => void;
  invalidLimit: boolean;
  disabled: boolean;
  generating: boolean;
  error: unknown;
  onGenerate: () => void;
}) {
  const unavailable =
    period.status === "CLOSED" || period.status === "ARCHIVED";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Generar propuesta</CardTitle>
        <CardDescription>
          Genera una propuesta sin guardar para {period.name}. El servidor
          valida la estructura, cargas y restricciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm">
          <Label htmlFor="generation-search-limit">
            Límite de búsqueda (opcional)
          </Label>
          <Input
            id="generation-search-limit"
            inputMode="numeric"
            value={maxSearchNodes}
            onChange={(event) => onLimitChange(event.target.value)}
            placeholder="Predeterminado del servidor"
            aria-describedby="generation-search-limit-help"
          />
          <p
            id="generation-search-limit-help"
            className="mt-1 text-xs text-muted-foreground"
          >
            Entre 1 y 1 000 000 nodos. Déjalo vacío para usar el valor
            predeterminado.
          </p>
          {invalidLimit ? (
            <p role="alert" className="mt-1 text-sm text-destructive">
              Ingresa un número entero entre 1 y 1 000 000.
            </p>
          ) : null}
        </div>
        {unavailable ? (
          <p className="text-sm text-muted-foreground">
            No se pueden generar horarios para un período cerrado o archivado.
          </p>
        ) : null}
        {!unavailable && !structurallyReady ? (
          <p className="text-sm text-muted-foreground">
            Configura días y al menos un bloque lectivo válido antes de generar.
          </p>
        ) : null}
        {loadsLoading ? (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Comprobando cargas lectivas…
          </p>
        ) : null}
        {loadsError ? <ReadError error={loadsError} /> : null}
        {error ? <ReadError error={error} /> : null}
        <Button onClick={onGenerate} disabled={disabled} aria-busy={generating}>
          {generating ? "Generando propuesta…" : "Generar propuesta"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CandidatePreview({
  candidate,
  structure,
  loads,
  hasExistingTimetable,
  saving,
  saveError,
  onSave,
  onDiscard,
}: {
  candidate: TimetableGeneration;
  structure?: ScheduleStructureDetail;
  loads: Array<{
    teacherAssignmentId: string;
    courseId: string;
    courseName: string;
    subjectName: string;
    teacherId: string;
    teacherName: string;
  }>;
  hasExistingTimetable: boolean;
  saving: boolean;
  saveError: unknown;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const [courseId, setCourseId] = useState("all");
  const slots = useMemo(
    () =>
      candidate.slots.map((slot, index): TimetableSlot => {
        const load = loads.find(
          (item) => item.teacherAssignmentId === slot.teacherAssignmentId,
        );
        const block = structure?.blocks.find(
          (item) => item.id === slot.scheduleBlockId,
        );
        return {
          id: `candidate-${index}`,
          ...slot,
          teacherId: load?.teacherId ?? "",
          courseId: load?.courseId ?? "",
          scheduleBlockPosition: block?.position ?? 0,
          scheduleBlockStartTime: block?.startTime ?? "",
          scheduleBlockEndTime: block?.endTime ?? "",
          courseName: load?.courseName ?? "Curso no disponible",
          subjectName: load?.subjectName ?? "Asignatura no disponible",
          teacherName: load?.teacherName ?? "Docente no disponible",
        };
      }),
    [candidate.slots, loads, structure],
  );
  const courses = Array.from(
    new Map(slots.map((slot) => [slot.courseId, slot.courseName])).entries(),
  );
  const visibleSlots =
    courseId === "all"
      ? slots
      : slots.filter((slot) => slot.courseId === courseId);
  const canSave =
    candidate.status === "SUCCESS" && candidate.validation?.valid === true;
  return (
    <Card className="border-primary/40">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">Propuesta sin guardar</CardTitle>
          <Badge variant={canSave ? "success" : "secondary"}>
            {generationStatusLabel(candidate.status)}
          </Badge>
        </div>
        <CardDescription>
          Esta propuesta no crea un horario hasta que la guardes como borrador.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {candidate.statistics.generatedSlots} asignaciones generadas de{" "}
          {candidate.statistics.requirements} requeridas;{" "}
          {candidate.statistics.searchNodesExplored} nodos explorados.
        </p>
        {courses.length > 1 ? (
          <div className="max-w-sm">
            <Label htmlFor="candidate-course">Inspeccionar curso</Label>
            <Select
              id="candidate-course"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
            >
              <option value="all">Todos los cursos</option>
              {courses.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        {structure ? (
          <WeeklyGrid
            structure={structure}
            timetable={{
              id: "candidate",
              institutionId: structure.institutionId,
              academicPeriodId: structure.academicPeriodId,
              status: "DRAFT",
              version: 0,
              createdAt: "",
              updatedAt: "",
              publishedAt: null,
              publishedByUserId: null,
              slots,
            }}
            slots={visibleSlots}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No se puede representar la propuesta sin la estructura horaria.
          </p>
        )}
        <GenerationDiagnostics candidate={candidate} />
        {hasExistingTimetable ? (
          <p className="text-sm text-muted-foreground">
            Ya existe un horario guardado para este período. Descártalo antes de
            guardar esta propuesta.
          </p>
        ) : null}
        {saveError ? <ReadError error={saveError} /> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onSave}
            disabled={!canSave || saving || hasExistingTimetable}
          >
            {saving ? "Guardando borrador…" : "Guardar como borrador"}
          </Button>
          <Button variant="outline" onClick={onDiscard} disabled={saving}>
            Descartar propuesta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GenerationDiagnostics({
  candidate,
}: {
  candidate: TimetableGeneration;
}) {
  if (!candidate.diagnostics.length && candidate.validation?.valid !== false)
    return (
      <p className="text-sm text-muted-foreground">
        La generación no reportó restricciones incumplidas.
      </p>
    );
  return (
    <div className="space-y-3">
      <h3 className="font-medium">Diagnósticos de generación</h3>
      <ul className="space-y-2" role="list">
        {candidate.diagnostics.map((diagnostic, index) => (
          <li
            key={`${diagnostic.code}-${index}`}
            className="rounded-md border border-destructive/30 p-3 text-sm"
          >
            <p className="font-medium text-destructive">
              {generationDiagnosticLabel(diagnostic.code)}
            </p>
            <p className="mt-1 text-muted-foreground">{diagnostic.message}</p>
          </li>
        ))}
      </ul>
      {candidate.validation ? (
        <ValidationPanel
          validation={candidate.validation}
          loading={false}
          error={undefined}
        />
      ) : null}
    </div>
  );
}

function TimetableContent({
  timetable,
  structure,
  structureLoading,
  structureError,
  validation,
  validationLoading,
  validationError,
  teachingLoads,
  editable,
  onRevalidate,
  onDiscard,
  onPublish,
  publishTriggerRef,
  onUnpublish,
  unpublishTriggerRef,
  publishing,
  onReplace,
  replacing,
  discarding,
  discardError,
}: {
  timetable: Timetable;
  structure?: ScheduleStructureDetail;
  structureLoading: boolean;
  structureError: unknown;
  validation?: ReturnType<typeof useTimetableValidation>["data"];
  validationLoading: boolean;
  validationError: unknown;
  teachingLoads: TeachingLoad[];
  editable: boolean;
  onRevalidate?: () => void;
  onDiscard?: () => void;
  onPublish?: () => void;
  publishTriggerRef: RefObject<HTMLButtonElement | null>;
  onUnpublish?: () => void;
  unpublishTriggerRef: RefObject<HTMLButtonElement | null>;
  publishing: boolean;
  onReplace: (slots: TimetableSlotInput[]) => Promise<Timetable>;
  replacing: boolean;
  discarding: boolean;
  discardError: unknown;
}) {
  const [courseId, setCourseId] = useState("all");
  const courses = useMemo(
    () =>
      Array.from(
        new Map(
          timetable.slots.map((slot) => [
            slot.courseId,
            slot.courseName || "Curso sin nombre",
          ]),
        ).entries(),
      ),
    [timetable.slots],
  );
  const visibleSlots =
    courseId === "all"
      ? timetable.slots
      : timetable.slots.filter((slot) => slot.courseId === courseId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={timetable.status === "PUBLISHED" ? "success" : "secondary"}
        >
          {statusLabel(timetable.status)}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Versión {timetable.version}
        </span>
        {onRevalidate ? (
          <Button
            variant="outline"
            onClick={onRevalidate}
            disabled={validationLoading}
          >
            Revalidar borrador
          </Button>
        ) : null}
        {onPublish ? (
          <Button
            ref={publishTriggerRef}
            onClick={onPublish}
            disabled={
              publishing || validationLoading || validation?.valid !== true
            }
          >
            {publishing ? "Comprobando publicación…" : "Publicar horario"}
          </Button>
        ) : null}
        {onUnpublish ? (
          <Button
            ref={unpublishTriggerRef}
            variant="outline"
            onClick={onUnpublish}
            disabled={publishing}
          >
            Anular publicación
          </Button>
        ) : null}
        {onDiscard ? (
          <Button variant="outline" onClick={onDiscard} disabled={discarding}>
            {discarding ? "Descartando…" : "Descartar borrador"}
          </Button>
        ) : null}
      </div>
      {courses.length > 1 ? (
        <div className="max-w-sm">
          <Label htmlFor="weekly-course">Curso</Label>
          <Select
            id="weekly-course"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
          >
            <option value="all">Todos los cursos</option>
            {courses.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      {structureLoading ? (
        <p className="text-sm text-muted-foreground">
          Cargando la estructura horaria…
        </p>
      ) : null}
      {structureError ? <ReadError error={structureError} /> : null}
      {!structureLoading && !structureError && !structure ? (
        <p className="rounded-md border border-border p-3 text-sm text-muted-foreground">
          No hay estructura horaria disponible para representar este horario.
        </p>
      ) : null}
      {structure ? (
        <WeeklyGrid
          structure={structure}
          timetable={timetable}
          slots={visibleSlots}
        />
      ) : null}
      {structure && editable ? (
        <DraftSlotEditor
          timetable={timetable}
          structure={structure}
          loads={teachingLoads}
          saving={replacing}
          onSave={onReplace}
        />
      ) : null}
      {timetable.status === "PUBLISHED" ? (
        <p className="text-sm text-muted-foreground">
          Los horarios publicados son de solo lectura.
        </p>
      ) : null}
      <ValidationPanel
        validation={validation}
        loading={validationLoading}
        error={validationError}
      />
      {discardError ? <ReadError error={discardError} /> : null}
    </div>
  );
}

function TransitionConfirmation({
  action,
  pending,
  publishTriggerRef,
  unpublishTriggerRef,
  onCancel,
  onConfirm,
}: {
  action?: "publish" | "unpublish";
  pending: boolean;
  publishTriggerRef: RefObject<HTMLButtonElement | null>;
  unpublishTriggerRef: RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const lastActionRef = useRef<"publish" | "unpublish" | undefined>(undefined);
  useEffect(() => {
    if (action) {
      lastActionRef.current = action;
      cancelRef.current?.focus();
      return;
    }
    const restoreFocus = window.setTimeout(() => {
      (lastActionRef.current === "publish"
        ? publishTriggerRef
        : unpublishTriggerRef
      ).current?.focus();
    }, 0);
    return () => window.clearTimeout(restoreFocus);
  }, [action, publishTriggerRef, unpublishTriggerRef]);
  if (!action) return null;
  const publishing = action === "publish";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="timetable-transition-title"
        aria-describedby="timetable-transition-description"
        className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg"
      >
        <h2 id="timetable-transition-title" className="text-lg font-semibold">
          {publishing
            ? "Confirmar publicación"
            : "Confirmar anulación de publicación"}
        </h2>
        <p
          id="timetable-transition-description"
          className="mt-2 text-sm text-muted-foreground"
        >
          {publishing
            ? "El servidor volverá a validar el horario antes de publicarlo. Una vez publicado quedará en modo de solo lectura."
            : "El horario volverá a borrador editable y conservará sus asignaciones. No se eliminará."}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            ref={cancelRef}
            variant="outline"
            onClick={onCancel}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={pending} aria-busy={pending}>
            {pending
              ? "Procesando…"
              : publishing
                ? "Sí, publicar"
                : "Sí, anular publicación"}
          </Button>
        </div>
      </div>
    </div>
  );
}

type DraftSlot = TimetableSlotInput & { key: string };

function DraftSlotEditor({
  timetable,
  structure,
  loads,
  saving,
  onSave,
}: {
  timetable: Timetable;
  structure: ScheduleStructureDetail;
  loads: TeachingLoad[];
  saving: boolean;
  onSave: (slots: TimetableSlotInput[]) => Promise<Timetable>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftSlot[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>();
  const [saveError, setSaveError] = useState<unknown>();
  const initial = () =>
    timetable.slots.map((slot) => ({
      key: slot.id,
      teacherAssignmentId: slot.teacherAssignmentId,
      weekday: slot.weekday,
      scheduleBlockId: slot.scheduleBlockId,
    }));
  const selected = draft.find((slot) => slot.key === selectedKey);
  const teachingBlocks = structure.blocks
    .filter((block) => block.kind === "TEACHING")
    .sort((left, right) => left.position - right.position);
  const changed =
    JSON.stringify(draft.map(({ key: _key, ...slot }) => slot)) !==
    JSON.stringify(initial().map(({ key: _key, ...slot }) => slot));
  const begin = () => {
    const next = initial();
    setDraft(next);
    setSelectedKey(next[0]?.key);
    setSaveError(undefined);
    setEditing(true);
  };
  const cancel = () => {
    if (
      !changed ||
      window.confirm(
        "¿Cancelar la edición? Se perderán los cambios locales no guardados.",
      )
    ) {
      setEditing(false);
      setDraft([]);
      setSelectedKey(undefined);
      setSaveError(undefined);
    }
  };
  const update = (changes: Partial<TimetableSlotInput>) =>
    setDraft((items) =>
      items.map((slot) =>
        slot.key === selectedKey ? { ...slot, ...changes } : slot,
      ),
    );
  const occupied = (candidate: TimetableSlotInput, ignoreKey?: string) =>
    draft.some(
      (slot) =>
        slot.key !== ignoreKey &&
        slot.weekday === candidate.weekday &&
        slot.scheduleBlockId === candidate.scheduleBlockId,
    );
  const assignmentBlocked = (
    assignment: TeachingLoad,
    candidate: TimetableSlotInput,
    ignoreKey?: string,
  ) =>
    draft.some((slot) => {
      if (
        slot.key === ignoreKey ||
        slot.weekday !== candidate.weekday ||
        slot.scheduleBlockId !== candidate.scheduleBlockId
      )
        return false;
      const other = loads.find(
        (load) => load.teacherAssignmentId === slot.teacherAssignmentId,
      );
      return (
        other?.teacherId === assignment.teacherId ||
        other?.courseId === assignment.courseId
      );
    });
  const add = () => {
    const destination = structure.enabledWeekdays
      .flatMap((weekday) =>
        teachingBlocks.map((block) => ({ weekday, scheduleBlockId: block.id })),
      )
      .find(
        (cell) =>
          !occupied({
            teacherAssignmentId: loads[0]?.teacherAssignmentId ?? "",
            ...cell,
          }),
      );
    if (!destination || !loads[0]) return;
    const key = `new-${Date.now()}`;
    setDraft((items) => [
      ...items,
      {
        key,
        teacherAssignmentId: loads[0]!.teacherAssignmentId,
        ...destination,
      },
    ]);
    setSelectedKey(key);
  };
  const remove = () => {
    if (!selectedKey) return;
    setDraft((items) => items.filter((slot) => slot.key !== selectedKey));
    setSelectedKey(draft.find((slot) => slot.key !== selectedKey)?.key);
  };
  const save = async () => {
    setSaveError(undefined);
    try {
      await onSave(draft.map(({ key: _key, ...slot }) => slot));
      setEditing(false);
      setDraft([]);
      setSelectedKey(undefined);
    } catch (error) {
      setSaveError(error);
    }
  };
  if (!editing)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Edición del borrador</CardTitle>
          <CardDescription>
            Modifica asignaciones del horario sin publicar cambios. El servidor
            revisará la colección completa al guardar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={begin}>Editar horario</Button>
        </CardContent>
      </Card>
    );
  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-lg">Editar asignaciones</CardTitle>
        <CardDescription>
          Selecciona una asignación o añade una en un bloque lectivo libre. Los
          cambios permanecen locales hasta guardar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={add}
            disabled={!loads.length || !teachingBlocks.length}
          >
            Añadir asignación
          </Button>
          <Button variant="outline" onClick={cancel} disabled={saving}>
            Cancelar edición
          </Button>
          <Button onClick={() => void save()} disabled={!changed || saving}>
            {saving ? "Guardando cambios…" : "Guardar cambios"}
          </Button>
        </div>
        {!loads.length ? (
          <p role="alert" className="text-sm text-destructive">
            No hay cargas lectivas disponibles para editar este horario.
          </p>
        ) : null}
        {saveError ? <SlotSaveError error={saveError} /> : null}
        {!draft.length ? (
          <p className="text-sm text-muted-foreground">
            No quedan asignaciones. Añade una carga lectiva antes de guardar.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
            <div>
              <h3 className="mb-2 font-medium">Asignaciones del borrador</h3>
              <ul className="space-y-2" role="list">
                {draft.map((slot) => {
                  const load = loads.find(
                    (item) =>
                      item.teacherAssignmentId === slot.teacherAssignmentId,
                  );
                  const block = teachingBlocks.find(
                    (item) => item.id === slot.scheduleBlockId,
                  );
                  return (
                    <li key={slot.key}>
                      <Button
                        variant={
                          slot.key === selectedKey ? "default" : "outline"
                        }
                        className="h-auto w-full justify-start whitespace-normal text-left"
                        onClick={() => setSelectedKey(slot.key)}
                        aria-pressed={slot.key === selectedKey}
                      >
                        <span>
                          {load
                            ? `${load.subjectName} · ${load.courseName} · ${load.teacherName}`
                            : "Carga lectiva no disponible"}
                          <span className="block text-xs opacity-80">
                            {weekdayLabels[slot.weekday]} ·{" "}
                            {block?.name || "Bloque no disponible"}
                          </span>
                        </span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
            {selected ? (
              <fieldset className="space-y-4 rounded-md border p-4">
                <legend className="px-1 font-medium">
                  Asignación seleccionada
                </legend>
                <div>
                  <Label htmlFor="edit-load">Carga lectiva</Label>
                  <Select
                    id="edit-load"
                    value={selected.teacherAssignmentId}
                    onChange={(event) =>
                      update({ teacherAssignmentId: event.target.value })
                    }
                  >
                    {loads.map((load) => (
                      <option
                        key={load.teacherAssignmentId}
                        value={load.teacherAssignmentId}
                        disabled={assignmentBlocked(
                          load,
                          selected,
                          selected.key,
                        )}
                      >
                        {load.subjectName} · {load.courseName} ·{" "}
                        {load.teacherName}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-weekday">Día</Label>
                  <Select
                    id="edit-weekday"
                    value={selected.weekday}
                    onChange={(event) =>
                      update({ weekday: event.target.value as Weekday })
                    }
                  >
                    {structure.enabledWeekdays.map((day) => (
                      <option
                        key={day}
                        value={day}
                        disabled={occupied(
                          { ...selected, weekday: day },
                          selected.key,
                        )}
                      >
                        {weekdayLabels[day]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-block">Bloque lectivo</Label>
                  <Select
                    id="edit-block"
                    value={selected.scheduleBlockId}
                    onChange={(event) =>
                      update({ scheduleBlockId: event.target.value })
                    }
                  >
                    {teachingBlocks.map((block) => (
                      <option
                        key={block.id}
                        value={block.id}
                        disabled={occupied(
                          { ...selected, scheduleBlockId: block.id },
                          selected.key,
                        )}
                      >
                        {block.name || "Clase"} · {block.startTime} –{" "}
                        {block.endTime}
                      </option>
                    ))}
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Las opciones ocupadas se deshabilitan. La validación final de
                  docente, curso y carga la realiza el servidor.
                </p>
                <Button variant="outline" onClick={remove} disabled={saving}>
                  Quitar asignación
                </Button>
              </fieldset>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SlotSaveError({ error }: { error: unknown }) {
  if (error instanceof ApiError && error.statusCode === 409)
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/40 p-3 text-sm text-destructive"
      >
        <p>
          El horario cambió en otra sesión o ya no puede modificarse. Recarga la
          página para revisar la versión actual antes de descartar tus cambios.
        </p>
        <p className="mt-1">{error.message}</p>
      </div>
    );
  const conflicts =
    error instanceof ApiError && Array.isArray(error.conflicts)
      ? error.conflicts.filter(
          (item): item is TimetableConflict =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as { code?: unknown }).code === "string" &&
            typeof (item as { message?: unknown }).message === "string",
        )
      : [];
  if (conflicts.length)
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/40 p-3 text-sm text-destructive"
      >
        <p className="font-medium">
          El servidor rechazó los cambios por conflictos de horario.
        </p>
        <ul className="mt-2 space-y-1" role="list">
          {conflicts.map((conflict, index) => (
            <li key={`${conflict.code}-${index}`}>
              {conflictLabel(conflict)}: {conflict.message}
            </li>
          ))}
        </ul>
      </div>
    );
  return <ReadError error={error} />;
}

function WeeklyGrid({
  structure,
  timetable,
  slots,
}: {
  structure: ScheduleStructureDetail;
  timetable: Timetable;
  slots: Timetable["slots"];
}) {
  const blocks = [...structure.blocks].sort(
    (left, right) => left.position - right.position,
  );
  const byCell = new Map(
    slots.map((slot) => [`${slot.weekday}:${slot.scheduleBlockId}`, slot]),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cuadrícula semanal</CardTitle>
        <CardDescription>
          Período{" "}
          {timetable.academicPeriodId === structure.academicPeriodId
            ? "seleccionado"
            : "asociado"}
          . Los recreos y tiempos no lectivos provienen de la estructura
          horaria.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          role="region"
          aria-label="Cuadrícula del horario semanal"
          tabIndex={0}
          className="overflow-x-auto rounded-md border"
        >
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <caption className="sr-only">
              Horario semanal de solo lectura
            </caption>
            <thead>
              <tr className="border-b bg-muted/50">
                <th
                  scope="col"
                  className="min-w-40 px-3 py-2 text-left font-medium"
                >
                  Bloque
                </th>
                {structure.enabledWeekdays.map((day) => (
                  <th
                    key={day}
                    scope="col"
                    className="min-w-48 px-3 py-2 text-left font-medium"
                  >
                    {weekdayLabels[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.id} className="border-b last:border-0">
                  <th
                    scope="row"
                    className="align-top px-3 py-3 text-left font-medium"
                  >
                    <span className="block">
                      {block.name || blockKindLabels[block.kind]}
                    </span>
                    <span className="font-normal text-muted-foreground">
                      {block.startTime} – {block.endTime}
                    </span>
                  </th>
                  {structure.enabledWeekdays.map((day) => (
                    <GridCell
                      key={day}
                      block={block}
                      slot={byCell.get(`${day}:${block.id}`)}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function GridCell({
  block,
  slot,
}: {
  block: ScheduleBlock;
  slot?: Timetable["slots"][number];
}) {
  if (block.kind !== "TEACHING")
    return (
      <td className="bg-muted/30 px-3 py-3 align-top text-muted-foreground">
        <span className="font-medium">{blockKindLabels[block.kind]}</span>
        {block.name ? (
          <span className="block text-xs">{block.name}</span>
        ) : null}
      </td>
    );
  if (!slot)
    return (
      <td className="px-3 py-3 align-top text-muted-foreground">Sin clase</td>
    );
  return (
    <td className="px-3 py-3 align-top">
      <p className="font-medium">
        {slot.subjectName || "Asignatura sin nombre"}
      </p>
      <p className="text-muted-foreground">
        {slot.courseName || "Curso sin nombre"}
      </p>
      <p className="text-muted-foreground">
        {slot.teacherName || "Docente sin asignar"}
      </p>
    </td>
  );
}

function ValidationPanel({
  validation,
  loading,
  error,
}: {
  validation: ReturnType<typeof useTimetableValidation>["data"];
  loading: boolean;
  error: unknown;
}) {
  if (loading)
    return (
      <p className="text-sm text-muted-foreground">Validando el horario…</p>
    );
  if (error) return <ReadError error={error} />;
  if (!validation) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Diagnóstico del horario</CardTitle>
        <CardDescription>
          Resultado de la validación actual del servidor (
          {validation.mode === "COMPLETE" ? "completa" : "parcial"}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {validation.valid ? (
          <p className="text-sm text-muted-foreground">
            El servidor no reporta conflictos para este horario.
          </p>
        ) : (
          <ul className="space-y-3" role="list">
            {validation.conflicts.map((conflict, index) => (
              <li
                key={`${conflict.code}-${index}`}
                className="rounded-md border border-destructive/30 p-3 text-sm"
              >
                <p className="font-medium text-destructive">
                  {conflictLabel(conflict)}
                </p>
                <p className="mt-1 text-muted-foreground">{conflict.message}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyTimetable() {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        Todavía no existe un horario generado para este período. Esta vista no
        genera ni modifica horarios.
      </CardContent>
    </Card>
  );
}
function ReadError({ error }: { error: unknown }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/40 p-3 text-sm text-destructive"
    >
      {error instanceof ApiError
        ? error.message
        : "No se pudo consultar esta información. Inténtalo de nuevo."}
    </p>
  );
}
function statusLabel(status: Timetable["status"]) {
  return status === "PUBLISHED" ? "Publicado" : "Borrador";
}
function conflictLabel(conflict: TimetableConflict) {
  const labels: Record<string, string> = {
    TEACHER_CONFLICT: "Conflicto de docente",
    COURSE_CONFLICT: "Conflicto de curso",
    INVALID_BLOCK: "Bloque no válido",
    INVALID_DAY: "Día no válido",
    CONTEXT_MISMATCH: "Contexto no coincide",
    LOAD_UNSATISFIED: "Carga incompleta",
    LOAD_OVERSATISFIED: "Carga excedida",
    MISSING_TEACHING_LOAD: "Carga lectiva faltante",
    DUPLICATE_CANDIDATE: "Asignación duplicada",
  };
  return labels[conflict.code] ?? conflict.code;
}
function generationStatusLabel(status: TimetableGeneration["status"]) {
  const labels: Record<TimetableGeneration["status"], string> = {
    SUCCESS: "Propuesta completa",
    INVALID_CONFIGURATION: "Configuración incompleta",
    UNSATISFIABLE: "No se encontró una propuesta válida",
    SEARCH_LIMIT_REACHED: "Límite de búsqueda alcanzado",
  };
  return labels[status];
}
function generationDiagnosticLabel(code: string) {
  const labels: Record<string, string> = {
    MISSING_SCHEDULE_STRUCTURE: "Estructura horaria faltante",
    NO_ENABLED_WEEKDAYS: "No hay días lectivos",
    NO_TEACHING_BLOCKS: "No hay bloques lectivos",
    INVALID_SCHEDULE_BLOCK: "Bloque horario no válido",
    OVERLAPPING_SCHEDULE_BLOCKS: "Bloques horarios superpuestos",
    INVALID_ASSIGNMENT_CONTEXT: "Asignación fuera del contexto",
    DUPLICATE_ASSIGNMENT: "Asignación duplicada",
    MISSING_TEACHING_LOAD: "Carga lectiva faltante",
    INVALID_WEEKLY_PERIODS: "Carga lectiva inválida",
    COURSE_CAPACITY_EXCEEDED: "Capacidad del curso excedida",
    TEACHER_CAPACITY_EXCEEDED: "Capacidad del docente excedida",
    NO_FEASIBLE_TIMETABLE: "No hay horario factible",
    SEARCH_NODE_LIMIT_REACHED: "Límite de búsqueda alcanzado",
    AUTHORITATIVE_CONFLICT: "Conflicto validado por el servidor",
  };
  return labels[code] ?? `Diagnóstico del servidor: ${code}`;
}
