# Ecuador academic master data

Reviewed 2026-10-04 against public MINEDUC material. This document records
Zerocademy's Ecuador defaults; it does not turn the product into a closed
national catalog. Institutions may still create their own academic structure
and subjects.

## Adopted hierarchy

```text
Educación Inicial
  ├── Inicial 1 → Inicial 1
  └── Inicial 2 → Inicial 2
Educación General Básica
  ├── Preparatoria → 1.º EGB
  ├── Básica Elemental → 2.º–4.º EGB
  ├── Básica Media → 5.º–7.º EGB
  └── Básica Superior → 8.º–10.º EGB
Bachillerato
  └── Bachillerato → 1.º–3.º Bachillerato
```

`AcademicLevel → SubLevel → GradeLevel → Course` represents this hierarchy.
`subLevelId` remains nullable in the database for historical/non-canonical rows,
but it is required for new courses and must match the chosen grade's mapped
sublevel.

## Canonical SubLevel catalog

Internal Zerocademy codes (not MINEDUC machine codes):

| Code               | Name             | AcademicLevel |
| ------------------ | ---------------- | ------------- |
| `INICIAL_1`        | Inicial 1        | `INICIAL`     |
| `INICIAL_2`        | Inicial 2        | `INICIAL`     |
| `EGB_PREPARATORIA` | Preparatoria     | `EGB`         |
| `EGB_ELEMENTAL`    | Básica Elemental | `EGB`         |
| `EGB_MEDIA`        | Básica Media     | `EGB`         |
| `EGB_SUPERIOR`     | Básica Superior  | `EGB`         |
| `BACHILLERATO`     | Bachillerato     | `BGU`         |

## Canonical GradeLevel → SubLevel mapping

| GradeLevel code | AcademicLevel | SubLevel             |
| --------------- | ------------- | -------------------- |
| `INI-1`         | `INICIAL`     | `INICIAL_1`          |
| `INI-2`         | `INICIAL`     | `INICIAL_2`          |
| `EGB-1`         | `EGB`         | `EGB_PREPARATORIA`   |
| `EGB-2`         | `EGB`         | `EGB_ELEMENTAL`      |
| `EGB-3`         | `EGB`         | `EGB_ELEMENTAL`      |
| `EGB-4`         | `EGB`         | `EGB_ELEMENTAL`      |
| `EGB-5`         | `EGB`         | `EGB_MEDIA`          |
| `EGB-6`         | `EGB`         | `EGB_MEDIA`          |
| `EGB-7`         | `EGB`         | `EGB_MEDIA`          |
| `EGB-8`         | `EGB`         | `EGB_SUPERIOR`       |
| `EGB-9`         | `EGB`         | `EGB_SUPERIOR`       |
| `EGB-10`        | `EGB`         | `EGB_SUPERIOR`       |
| `BGU-1`         | `BGU`         | `BACHILLERATO`       |
| `BGU-2`         | `BGU`         | `BACHILLERATO`       |
| `BGU-3`         | `BGU`         | `BACHILLERATO`       |

## Data backfill status (Neon)

Migration `20261004181000_backfill_academic_sublevels` (DEMY-146):

1. Inserts the seven canonical `SubLevel` rows when missing.
2. Assigns `GradeLevel.subLevelId` for the canonical codes above.
3. Backfills `Course.subLevelId` from the course's `GradeLevel.subLevelId` when
   the course value is null and the grade mapping is present (no overwrite on
   conflict).
4. Aligns platform `BGU` display name to **Bachillerato** and canonical BGU
   grade labels (`Primero/Segundo/Tercero de Bachillerato`).
5. Does **not** convert `GradeLevel.subLevelId` or `Course.subLevelId` to
   `NOT NULL`.
6. Does **not** delete AcademicLevels, GradeLevels, Courses, or assignments.

## BACH vs BGU

| Code   | Role                                                                                         | Action in DEMY-146                                      |
| ------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `BGU`  | Canonical Ecuador AcademicLevel code retained by seeds/docs; display name **Bachillerato** | Kept; grades `BGU-1..3` mapped to SubLevel `BACHILLERATO` |
| `BACH` | Legacy AcademicLevel from earlier development seeds (`BACH-1..3`)                            | Preserved; grades left with `subLevelId = null`         |

They are separate `AcademicLevel` rows. No merge/delete was performed: `BACH`
grades have no courses and are outside the current Ecuador seed catalog.
Fresh seed installs create only `BGU`; migrated databases may still contain
`BACH` until a dedicated cleanup is approved.

## Remaining legacy / non-canonical rows

Rows intentionally left without `subLevelId` after backfill may include:

- Legacy `BACH` / `BACH-*` catalog rows
- Ad-hoc QA grades such as `NOVENO QA` under `EGB`
- Other custom grades without an explicit stable-code mapping

## Traceability and code provenance

| Zerocademy concept     | Internal code                                                    | Official label                                                | Code origin                                            | Official source                                                                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Academic regime        | `COSTA_GALAPAGOS`                                                | Costa - Galápagos                                             | Zerocademy internal; no official machine code found    | [MINEDUC calendar notice](https://educacion.gob.ec/cronograma-de-vacaciones-de-fin-de-ano-se-extiende-hasta-el-4-de-enero-2026-en-las-instituciones-educativas-fiscales-del-pais/)                                                          |
| Academic regime        | `SIERRA_AMAZONIA`                                                | Sierra - Amazonía                                             | Zerocademy internal; no official machine code found    | [MINEDUC teacher notice](https://educacion.gob.ec/gobierno-del-presidente-noboa-habilita-mas-de-2-000-vacantes-para-docentes/)                                                                                                              |
| Education level        | `INICIAL`, `EGB`, `BGU`                                          | Educación Inicial, Educación General Básica, Bachillerato     | Zerocademy internal catalog codes                      | [Currículo de Preparatoria](https://recursos.educacion.gob.ec/wp-content/uploads/2022/11/CURRICULO-PREPARATORIA.pdf)                                                                                                                        |
| EGB sublevels          | `EGB_PREPARATORIA`, `EGB_ELEMENTAL`, `EGB_MEDIA`, `EGB_SUPERIOR` | Preparatoria, Básica Elemental, Básica Media, Básica Superior | Zerocademy internal catalog codes                      | [Currículo de Preparatoria](https://recursos.educacion.gob.ec/wp-content/uploads/2022/11/CURRICULO-PREPARATORIA.pdf)                                                                                                                        |
| Grade labels           | `INI-*`, `EGB-*`, `BGU-*`                                        | Inicial 1/2, 1.º–10.º EGB, 1.º–3.º Bachillerato               | Zerocademy internal catalog codes                      | [Currículo de Preparatoria](https://recursos.educacion.gob.ec/wp-content/uploads/2022/11/CURRICULO-PREPARATORIA.pdf)                                                                                                                        |
| Curriculum identifiers | e.g. `CN.3…`, `EFL.3.5.3`                                        | Curriculum elements / learning outcomes                       | MINEDUC curriculum prefixes, not `Subject.code` values | [EGB Media curriculum](https://educacion.gob.ec/wp-content/uploads/downloads/2025/08/Curriculo-Priorizado-EGB-Media.pdf), [EFL guidelines](https://educacion.gob.ec/wp-content/uploads/downloads/2020/03/Lineamientos-Curriculares-NAP.pdf) |
| Subjects               | `LENGUA_LIT`, `MATEMATICA`, etc.                                 | Subject display labels                                        | Zerocademy internal catalog codes                      | [2016 curriculum](https://educacion.gob.ec/wp-content/uploads/downloads/2016/03/Curriculo1.pdf)                                                                                                                                             |

`BGU` is retained only as a stable legacy Zerocademy level code; its displayed
level name is **Bachillerato**. It is not asserted to be a MINEDUC machine
code. Bachillerato General Unificado and Bachillerato Técnico are distinct
offers/resources, not specializations modeled by this MVP. See the current
[Bachillerato portal](https://recursos.educacion.gob.ec/bachillerato/) and
[MINEDUC legal/normative catalogue](https://educacion.gob.ec/documentos-legales-y-normativos/).

## Subjects and curriculum areas

The seeded `Subject` catalog remains configurable and supports
institution-specific electives, languages, and technical subjects. It now stops
assigning the EGB/Bachillerato subject catalog to Educación Inicial: MINEDUC
Initial curriculum is organized through ejes and ámbitos rather than that
subject list. See the [Initial curriculum](https://educacion.gob.ec/wp-content/uploads/downloads/2025/07/curriculo-nacional-primera-infancia.pdf).

`CurriculumArea` is **deferred**. MINEDUC distinguishes areas and subjects,
particularly in Bachillerato, but present Zerocademy scheduling, assignment,
assessment, and reporting flows consume subjects directly. A separate area
table would not yet add a required behavior and would risk unnecessary catalog
migration. It should be reconsidered with official curriculum alignment or
skills/destrezas work.

## Operational ownership

`SUPER_ADMIN` alone may mutate the reusable SubLevel catalog. Everyone with
the appropriate catalog read role may query it, and course validation enforces
the canonical grade/sublevel relationship server-side.

## Sources and access context

Sources above were accessed on 2026-10-04. The curriculum documents establish
the hierarchy, grade ranges, curriculum organization, and identifier context;
they do not publish a single machine-readable API/enum catalog for Zerocademy
to adopt.
