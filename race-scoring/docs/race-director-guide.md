# Race Director Guide (3-Day Stage Race)

## Overview

Use `StageRace_3Day.xlsx` to run registration, stage scoring, and GC ranking for a three-day event.

Workflow order:
1. Configure fields and bib ranges.
2. Register riders.
3. Enter stage times each day.
4. Validate warnings.
5. Publish field and GC standings.

## Pre-Race Setup

1. Open the `Config` sheet.
2. Confirm race fields in `tblFields`.
3. Confirm bib ranges in `tblBibRanges`.
4. Confirm bonus seconds in `tblBonus`.
5. Verify global settings (`TimeFormat`, `NumStages`).

## Rider Registration

1. Go to `Registration`.
2. Add riders in `tblReg`.
3. Select `Field` for each rider (dropdown).
4. Set `Status`:
   - `Active` for starters.
   - `DNS` if rider does not start.
   - `DNF` for did not finish.
   - `DSQ` for disqualification.
5. Confirm each rider receives a bib automatically.

If `RANGE FULL` appears, expand bib range in `Config` or rebalance field capacity.

## Entering Stage Results

For each stage (`Stage1`, `Stage2`, `Stage3`):
1. Choose rider `Bib` in the stage table.
2. Enter `StageTime` in `hh:mm:ss`.
3. Verify auto-filled rider metadata (`Field`, names, team).
4. Review calculated:
   - `StageSeconds`
   - `Position`
   - `BonusSeconds`
   - `NetSeconds`
   - `NetTime`

Repeat for every rider who started that stage.

## Understanding GC

In `GC` sheet:
- Net seconds are pulled from each stage table.
- `TotalSec` is cumulative over 3 stages.
- `TotalTime` displays human-readable total race time.
- `GCRank` includes only riders with `Active` status.

Use per-field filtered sections for category podiums and publishable outputs.

## Adjusting Bonus Seconds

1. Go to `Config!tblBonus`.
2. Edit values in:
   - `Stage1BonusSec`
   - `Stage2BonusSec`
   - `Stage3BonusSec`
3. Keep `Place` rows aligned (1, 2, 3).

Changes recalculate stage net times and GC automatically.

## Troubleshooting Warnings (Dashboard)

### Bib range full
- Trigger: rider bib formula returns `RANGE FULL`.
- Fix: increase field bib range or reduce entries in that field.

### Missing stage times
- Trigger: bib selected in stage table but `StageTime` blank.
- Fix: complete missing time entry or remove bib from that row.

### Duplicate bibs
- Trigger: same bib appears in multiple registration rows.
- Fix: verify field and bib assignment order; correct manual overrides.

## Race-Day Operations Checklist

1. Before each stage start:
   - Confirm rider statuses.
   - Confirm no bib range warnings.
2. After each stage finish:
   - Enter all finish times.
   - Resolve missing time warnings.
   - Validate stage leaders.
3. End of day:
   - Verify GC leader and category standings.
   - Export/publish screenshots or copied tables.
4. Final day:
   - Confirm all statuses and final times.
   - Publish final GC and category results.

## Recommended Backup Practice

At the end of each stage day, save a dated copy of the workbook (for example: `StageRace_3Day_Backup_Day1.xlsx`) before entering the next stage.
