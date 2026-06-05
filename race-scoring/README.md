# 3-Day Stage Race Scoring System

This folder contains a complete Excel-based scoring system for a 3-day bicycle stage race.

## Purpose

The workbook (`StageRace_3Day.xlsx`) provides:
- Rider registration and bib assignment by category field.
- Per-stage time entry with automatic stage ranking.
- Time bonuses for top finishers (Stages 1 and 2).
- General Classification (GC) totals and rankings.
- A dashboard for operations, leaders, and warning checks.

## Workbook Layout

- `Config`: race setup tables and global settings.
- `Registration`: rider registration table (`tblReg`) with bib auto-assignment.
- `Stage1`, `Stage2`, `Stage3`: stage result tables (`tblStage1`, `tblStage2`, `tblStage3`).
- `GC`: overall classification table (`tblGC`).
- `Dashboard`: summary metrics, leaders, warnings, and navigation links.

## How To Use Registration

1. Open `StageRace_3Day.xlsx` and go to `Registration`.
2. Enter each rider in `tblReg`:
   - `FirstName`
   - `LastName`
   - `Field` (dropdown from Config fields)
   - `Team`
   - `LicenseID`
   - `Status` (`Active`, `DNS`, `DNF`, `DSQ`)
3. `Bib` is auto-assigned from the selected field's bib range.
4. If a category runs out of bib numbers, `Bib` shows `RANGE FULL`.

## How To Enter Stage Times

1. Go to `Stage1`, `Stage2`, or `Stage3`.
2. In the corresponding stage table, select rider `Bib` from dropdown.
3. Enter `StageTime` in `hh:mm:ss` format.
4. The workbook automatically calculates:
   - `Field`, `FirstName`, `LastName`, `Team`
   - `StageSeconds`
   - `Position`
   - `BonusSeconds`
   - `NetSeconds`
   - `NetTime`

## How GC Is Calculated

In `GC` (`tblGC`):
- `S1NetSec`, `S2NetSec`, and `S3NetSec` are pulled from stage tables.
- `TotalSec` = `S1NetSec + S2NetSec + S3NetSec`.
- `TotalTime` converts `TotalSec` to `hh:mm:ss`.
- `GCRank` is calculated only for riders whose status is `Active`.

## How Bonus Seconds Work

Bonus table is in `Config!tblBonus`:
- Place 1: 10 sec on Stage1 and Stage2, 0 on Stage3
- Place 2: 6 sec on Stage1 and Stage2, 0 on Stage3
- Place 3: 4 sec on Stage1 and Stage2, 0 on Stage3

`BonusSeconds` is matched from rider `Position` and stage-specific bonus column.

## How Bib Auto-Assignment Works

Bib ranges come from `Config!tblBibRanges`.
For each registration row, formula logic:
- Finds selected field.
- Looks up bib start/end for that field.
- Finds existing bibs already assigned in that field.
- Assigns next available bib.
- Returns `RANGE FULL` if next bib exceeds category end range.

## How To Modify Fields And Bib Ranges

1. Go to `Config`.
2. Update `tblFields` to add/remove race fields.
3. Update `tblBibRanges` so each field has a non-overlapping `BibStart` and `BibEnd`.
4. Ensure stage and GC field filters still match your field names.
5. If changing stage count or format conventions, also update formulas in stage and GC sheets.

## Included Documentation

- `docs/system-architecture.md`
- `docs/formulas-reference.md`
- `docs/race-director-guide.md`
