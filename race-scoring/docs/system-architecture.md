# System Architecture

## Sheet Structure

The workbook `StageRace_3Day.xlsx` contains:
- `Config`
- `Registration`
- `Stage1`
- `Stage2`
- `Stage3`
- `GC`
- `Dashboard`

## Table Names

- `Config`:
  - `tblFields`
  - `tblBibRanges`
  - `tblBonus`
- `Registration`:
  - `tblReg`
- `Stage1`:
  - `tblStage1`
- `Stage2`:
  - `tblStage2`
- `Stage3`:
  - `tblStage3`
- `GC`:
  - `tblGC`

## Data Flow

1. `Config` defines fields, bib ranges, bonus rules, and global settings.
2. `Registration.tblReg` stores the rider roster and status.
3. Each stage table reads rider identity fields from `tblReg` by bib.
4. Stage sheets convert stage times to seconds, rank riders, apply bonuses, and compute net stage time.
5. `GC.tblGC` pulls net seconds from each stage table, totals cumulative race time, and computes GC rank for active riders.
6. `Dashboard` summarizes field counts, stage leaders, GC leader, and quality warnings.

## Bib Assignment Logic

`Registration.tblReg[Bib]` uses a `LET` formula to:
- Read selected rider field from current row.
- Lookup `BibStart` and `BibEnd` for that field from `tblBibRanges`.
- Collect bibs already assigned in same field.
- Assign next available bib (`MAX + 1`) or `BibStart` for first entry.
- Return `RANGE FULL` if computed bib exceeds the field end.

This guarantees per-field bib assignment with hard range boundaries.

## Bonus Seconds Logic

Per stage row:
- Position is calculated by ranking `StageSeconds` ascending (lowest time is best).
- Bonus seconds are looked up by position from `Config!tblBonus` and stage-specific bonus column.
- Net seconds are computed as:

`NetSeconds = StageSeconds - BonusSeconds`

Configured default behavior:
- Stage1 and Stage2 award bonuses for places 1 to 3.
- Stage3 awards no bonus seconds.

## Filtered Views

Each stage sheet and GC sheet includes four dynamic filtered sections (one per field):
- Men Under 40
- Men 40+
- Men 50+
- Women

These are driven by `FILTER(...)` formulas and update automatically as input data changes.
