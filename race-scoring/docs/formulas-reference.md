# Formulas Reference

This document lists formulas used in `StageRace_3Day.xlsx`.

## Registration (`tblReg`)

### Bib auto-assignment

```excel
=LET(
  thisField, [@Field],
  starts,   Config!tblBibRanges[FieldName],
  startCol, Config!tblBibRanges[BibStart],
  endCol,   Config!tblBibRanges[BibEnd],
  bibStart, XLOOKUP(thisField, starts, startCol),
  bibEnd,   XLOOKUP(thisField, starts, endCol),
  sameFieldBib, FILTER(tblReg[Bib], tblReg[Field]=thisField),
  nextBib, IF(COUNTA(sameFieldBib)=0, bibStart, MAX(sameFieldBib)+1),
  IF(nextBib>bibEnd, "RANGE FULL", nextBib)
)
```

## Stage Sheets (`tblStage1`, `tblStage2`, `tblStage3`)

### Field
```excel
=IF([@Bib]="","",XLOOKUP([@Bib],tblReg[Bib],tblReg[Field],""))
```

### FirstName
```excel
=IF([@Bib]="","",XLOOKUP([@Bib],tblReg[Bib],tblReg[FirstName],""))
```

### LastName
```excel
=IF([@Bib]="","",XLOOKUP([@Bib],tblReg[Bib],tblReg[LastName],""))
```

### Team
```excel
=IF([@Bib]="","",XLOOKUP([@Bib],tblReg[Bib],tblReg[Team],""))
```

### StageSeconds
```excel
=HOUR([@StageTime])*3600 + MINUTE([@StageTime])*60 + SECOND([@StageTime])
```

Workbook implementation wraps with blank guard:
```excel
=IF([@StageTime]="","",HOUR([@StageTime])*3600 + MINUTE([@StageTime])*60 + SECOND([@StageTime]))
```

### Position
```excel
=RANK([@StageSeconds], tblStageX[StageSeconds], 1)
```

Workbook implementation wraps with blank guard:
```excel
=IF([@StageSeconds]="","",RANK([@StageSeconds],tblStageX[StageSeconds],1))
```

### BonusSeconds
```excel
=XLOOKUP([@Position], Config!tblBonus[Place], Config!tblBonus[StageXBonusSec])
```

Workbook implementation wraps with blank guard and default:
```excel
=IF([@Position]="",0,XLOOKUP([@Position],Config!tblBonus[Place],Config!tblBonus[StageXBonusSec],0))
```

### NetSeconds
```excel
=[@StageSeconds] - [@BonusSeconds]
```

Workbook implementation wraps with blank guard:
```excel
=IF([@StageSeconds]="","",[@StageSeconds]-[@BonusSeconds])
```

### NetTime
```excel
=[@NetSeconds]/86400
```

Workbook implementation wraps with blank guard:
```excel
=IF([@NetSeconds]="","",[@NetSeconds]/86400)
```

### Per-field stage filters
```excel
=FILTER(tblStageX, tblStageX[Field]="Men Under 40")
=FILTER(tblStageX, tblStageX[Field]="Men 40+")
=FILTER(tblStageX, tblStageX[Field]="Men 50+")
=FILTER(tblStageX, tblStageX[Field]="Women")
```

## GC (`tblGC`)

### Bib (seed from registration table by row index)
```excel
=IFERROR(INDEX(tblReg[Bib],ROW()-ROW(tblGC[#Headers])),"")
```

### Field / FirstName / LastName / Team / Status
```excel
=IF([@Bib]="","",XLOOKUP([@Bib],tblReg[Bib],tblReg[Field],""))
=IF([@Bib]="","",XLOOKUP([@Bib],tblReg[Bib],tblReg[FirstName],""))
=IF([@Bib]="","",XLOOKUP([@Bib],tblReg[Bib],tblReg[LastName],""))
=IF([@Bib]="","",XLOOKUP([@Bib],tblReg[Bib],tblReg[Team],""))
=IF([@Bib]="","",XLOOKUP([@Bib],tblReg[Bib],tblReg[Status],""))
```

### Stage net pulls
```excel
=IF([@Bib]="","",XLOOKUP([@Bib],tblStage1[Bib],tblStage1[NetSeconds],""))
=IF([@Bib]="","",XLOOKUP([@Bib],tblStage2[Bib],tblStage2[NetSeconds],""))
=IF([@Bib]="","",XLOOKUP([@Bib],tblStage3[Bib],tblStage3[NetSeconds],""))
```

### TotalSec
```excel
=S1NetSec + S2NetSec + S3NetSec
```

Workbook implementation:
```excel
=IF(COUNTA([@S1NetSec],[@S2NetSec],[@S3NetSec])=0,"",[@S1NetSec]+[@S2NetSec]+[@S3NetSec])
```

### TotalTime
```excel
=[@TotalSec]/86400
```

Workbook implementation wraps with blank guard:
```excel
=IF([@TotalSec]="","",[@TotalSec]/86400)
```

### GCRank (Active only)
```excel
=IF([@Status]<>"Active","",
   RANK([@TotalSec],
        FILTER(tblGC[TotalSec], tblGC[Status]="Active"),
        1
   )
)
```

## Dashboard

### Field summary
```excel
=COUNTIFS(tblReg[Field],Arow)
=COUNTIFS(tblReg[Field],Arow,tblReg[Status],"Active")
=Brow-Crow
```

### Stage leader bib
```excel
=IFERROR(XLOOKUP(MIN(FILTER(tblStageX[NetSeconds],tblStageX[NetSeconds]<>"")),tblStageX[NetSeconds],tblStageX[Bib]),"")
```

### Stage leader name
```excel
=IF(Brow="","",XLOOKUP(Brow,tblReg[Bib],tblReg[FirstName]&" "&tblReg[LastName],""))
```

### Stage leader time
```excel
=IF(Brow="","",MIN(FILTER(tblStageX[NetSeconds],tblStageX[NetSeconds]<>""))/86400)
```

### GC leader
```excel
=IFERROR(XLOOKUP(MIN(FILTER(tblGC[TotalSec],tblGC[Status]="Active")),tblGC[TotalSec],tblGC[Bib]),"")
=IF(B19="","",XLOOKUP(B19,tblReg[Bib],tblReg[FirstName]&" "&tblReg[LastName],""))
=IF(B19="","",MIN(FILTER(tblGC[TotalSec],tblGC[Status]="Active"))/86400)
```

### Warnings
```excel
=COUNTIF(tblReg[Bib],"RANGE FULL")
=COUNTIFS(tblStage1[Bib],"<>",tblStage1[StageTime],"")
=COUNTIFS(tblStage2[Bib],"<>",tblStage2[StageTime],"")
=COUNTIFS(tblStage3[Bib],"<>",tblStage3[StageTime],"")
=IFERROR(SUMPRODUCT(--(tblReg[Bib]<>""),--(COUNTIF(tblReg[Bib],tblReg[Bib])>1))/2,0)
```
