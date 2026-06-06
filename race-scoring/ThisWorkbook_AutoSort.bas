Attribute VB_Name = "ThisWorkbook"
Option Explicit

Private Sub Workbook_Open()
  Dim ws As Worksheet
  For Each ws In ThisWorkbook.Worksheets
    If IsStageWorksheet(ws) Then
      InitializeStageSheet ws
      ws.EnableSelection = xlUnlockedCells
      EnsureSortButton ws
    ElseIf ws.Name = "GC" Then
      EnsureSortButton ws
    End If
  Next ws
  SortGC
End Sub

Private Sub Workbook_SheetActivate(ByVal Sh As Object)
  On Error Resume Next

  If TypeName(Sh) = "Worksheet" Then
    If Sh.Name = "GC" Or IsStageWorksheet(Sh) Then
      EnsureSortButton Sh
    End If
  End If
End Sub

Public Sub RefreshRaceSorts()
  On Error Resume Next
  RecalculateAllSheetsCore
End Sub

Public Sub RecalculateAllSheetsCore()
  On Error GoTo RecalcExit

  Dim uiSheetName As String
  Dim uiSelectionAddress As String
  Dim hasUIContext As Boolean

  If Not ActiveSheet Is Nothing Then
    uiSheetName = ActiveSheet.Name
    If TypeName(Selection) = "Range" Then
      uiSelectionAddress = Selection.Address(False, False)
      hasUIContext = True
    End If
  End If

  Application.EnableEvents = False
  SyncAllStageSheetsFromRegistration
  SortStageSheet GetStageWorksheetByTable("tblStage1")
  SortStageSheet GetStageWorksheetByTable("tblStage2")
  SortStageSheet GetStageWorksheetByTable("tblStage3")
  SortGC

  If hasUIContext Then
    On Error Resume Next
    ThisWorkbook.Worksheets(uiSheetName).Activate
    ThisWorkbook.Worksheets(uiSheetName).Range(uiSelectionAddress).Select
    On Error GoTo RecalcExit
  End If

RecalcExit:
  Application.EnableEvents = True
End Sub

Public Sub ManualReorderStageCurrentSheetCore()
  RecalculateAllSheetsCore
End Sub

Public Sub ManualReorderGCCurrentSheetCore()
  RecalculateAllSheetsCore
End Sub

Private Sub SyncAllStageSheetsFromRegistration()
  SyncStageSheetFromRegistration GetStageWorksheetByTable("tblStage1")
  SyncStageSheetFromRegistration GetStageWorksheetByTable("tblStage2")
  SyncStageSheetFromRegistration GetStageWorksheetByTable("tblStage3")
End Sub

Private Sub SyncStageSheetFromRegistration(ByVal ws As Worksheet)
  On Error GoTo SyncExit

  If ws Is Nothing Then Exit Sub

  Dim reg As Worksheet, cfg As Worksheet
  Dim existingBib(1 To 250) As Long
  Dim existingTime(1 To 250) As Variant
  Dim existingCount As Long
  Dim r As Long, rowOut As Long, cfgRow As Long, regRow As Long
  Dim bib As Long, fieldName As String

  Set reg = ThisWorkbook.Worksheets("Registration")
  Set cfg = ThisWorkbook.Worksheets("Config")

  For r = 2 To 251
    If IsNumeric(ws.Cells(r, "A").Value) Then
      existingCount = existingCount + 1
      existingBib(existingCount) = CLng(ws.Cells(r, "A").Value)
      existingTime(existingCount) = ws.Cells(r, "F").Value
    End If
  Next r

  ws.Unprotect Password:="race-lock"
  ws.Range("A2:A251").ClearContents
  ws.Range("F2:F251").ClearContents

  rowOut = 2
  For cfgRow = 4 To 200
    fieldName = Trim$(CStr(cfg.Cells(cfgRow, "A").Value))
    If fieldName = "" Then Exit For

    For regRow = 2 To 201
      If rowOut > 251 Then Exit For
      If IsNumeric(reg.Cells(regRow, "A").Value) Then
        If StrComp(Trim$(CStr(reg.Cells(regRow, "D").Value)), fieldName, vbTextCompare) = 0 Then
          bib = CLng(reg.Cells(regRow, "A").Value)
          ws.Cells(rowOut, "A").Value = bib
          ws.Cells(rowOut, "F").Value = GetExistingStageTimeByBib(existingBib, existingTime, existingCount, bib)
          rowOut = rowOut + 1
        End If
      End If
    Next regRow
  Next cfgRow

SyncExit:
  ws.Protect Password:="race-lock", DrawingObjects:=True, Contents:=True, Scenarios:=True, _
      AllowSorting:=True, AllowFiltering:=True
  ws.EnableSelection = xlUnlockedCells
End Sub

Private Function GetExistingStageTimeByBib(ByRef bibList() As Long, ByRef timeList() As Variant, ByVal itemCount As Long, ByVal bib As Long) As Variant
  Dim i As Long
  For i = 1 To itemCount
    If bibList(i) = bib Then
      GetExistingStageTimeByBib = timeList(i)
      Exit Function
    End If
  Next i

  GetExistingStageTimeByBib = ""
End Function

Private Sub Workbook_SheetChange(ByVal Sh As Object, ByVal Target As Range)
  On Error GoTo SafeExit
  If Application.EnableEvents = False Then Exit Sub
  If Target Is Nothing Then Exit Sub
  If Target.CountLarge > 1 Then Exit Sub

  If Sh.Name = "Registration" Then
    HandleRegistrationSheetChange Sh, Target
    Exit Sub
  End If

  If Not IsStageWorksheet(Sh) Then Exit Sub
  If Intersect(Target, Sh.Range("F2:F251")) Is Nothing Then Exit Sub

  Dim enteredBib As Variant, enteredField As String
  Dim normalized As Variant

  If Not NormalizeStageEntry(Target.Value, normalized) Then
    MsgBox "Invalid time entry. Use hh:mm:ss, digits like 12345, or DNF/DNS.", vbExclamation, "Invalid Stage Entry"
    Application.EnableEvents = False
    Target.ClearContents
    Application.EnableEvents = True
    Exit Sub
  End If

  Application.EnableEvents = False
  Target.Value = normalized
  If IsNumeric(Target.Value) Then Target.NumberFormat = "hh:mm:ss"
  Application.EnableEvents = True

  enteredBib = Sh.Cells(Target.Row, "A").Value
  enteredField = CStr(Sh.Cells(Target.Row, "B").Value)
  If enteredBib = "" Then GoTo SafeExit

  Application.EnableEvents = False
  Application.Calculate

  Dim foundBib As Range
  Set foundBib = Sh.Range("A2:A251").Find(What:=enteredBib, LookIn:=xlValues, LookAt:=xlWhole)

  Dim r As Long
  If Not foundBib Is Nothing And Application.Visible Then
    For r = foundBib.Row + 1 To 251
      If CStr(Sh.Cells(r, "B").Value) = enteredField And CStr(Sh.Cells(r, "F").Value) = "" Then
        Sh.Cells(r, "F").Select
        GoTo Reprotect
      End If
    Next r

    For r = 2 To 251
      If CStr(Sh.Cells(r, "B").Value) = enteredField And CStr(Sh.Cells(r, "F").Value) = "" Then
        Sh.Cells(r, "F").Select
        GoTo Reprotect
      End If
    Next r

    Sh.Cells(foundBib.Row, "F").Select
  End If

Reprotect:

SafeExit:
  On Error Resume Next
  If IsStageWorksheet(Sh) Then
    Sh.Protect Password:="race-lock", DrawingObjects:=True, Contents:=True, Scenarios:=True, _
        AllowSorting:=True, AllowFiltering:=True
    Sh.EnableSelection = xlUnlockedCells
  End If
  Application.EnableEvents = True
End Sub

Private Sub HandleRegistrationSheetChange(ByVal ws As Worksheet, ByVal Target As Range)
  On Error GoTo RegExit

  If Target.Row < 2 Or Target.Row > 201 Then Exit Sub
  If Target.Column <> 1 And Target.Column <> 4 Then Exit Sub

  Dim fieldName As String
  Dim bibValue As Variant
  fieldName = Trim$(CStr(ws.Cells(Target.Row, "D").Value))

  Application.EnableEvents = False

  If Target.Column = 4 Then
    If fieldName = "" Then
      ws.Cells(Target.Row, "A").ClearContents
      GoTo RegExit
    End If

    bibValue = ws.Cells(Target.Row, "A").Value
    If Trim$(CStr(bibValue)) = "" Then
      AssignNextBib ws, Target.Row, fieldName
      GoTo RegExit
    End If

    If Not IsBibValidForField(bibValue, fieldName, ws, Target.Row) Then
      ws.Cells(Target.Row, "A").ClearContents
      AssignNextBib ws, Target.Row, fieldName
    End If
  ElseIf Target.Column = 1 Then
    bibValue = ws.Cells(Target.Row, "A").Value

    If Trim$(CStr(bibValue)) = "" Then GoTo RegExit

    If fieldName = "" Then
      MsgBox "Select a Field before entering Bib.", vbExclamation, "Bib Validation"
      ws.Cells(Target.Row, "A").ClearContents
      GoTo RegExit
    End If

    If Not IsBibValidForField(bibValue, fieldName, ws, Target.Row) Then
      MsgBox "Bib must be unique and within the selected field's configured range.", vbExclamation, "Bib Validation"
      ws.Cells(Target.Row, "A").ClearContents
      GoTo RegExit
    End If

    ws.Cells(Target.Row, "A").Value = CLng(CDbl(bibValue))
  End If

RegExit:
  Application.EnableEvents = True
End Sub

Private Sub AssignNextBib(ByVal ws As Worksheet, ByVal rowNum As Long, ByVal fieldName As String)
  Dim nextBib As Variant
  nextBib = GetNextAvailableBib(fieldName, ws, rowNum)

  If IsEmpty(nextBib) Then
    MsgBox "No available bib in the configured range for this field.", vbExclamation, "Bib Assignment"
    Exit Sub
  End If

  ws.Cells(rowNum, "A").Value = CLng(nextBib)
End Sub

Private Function GetNextAvailableBib(ByVal fieldName As String, ByVal ws As Worksheet, ByVal currentRow As Long) As Variant
  Dim bibStart As Long, bibEnd As Long
  Dim bibNum As Long

  If Not GetBibRange(fieldName, bibStart, bibEnd) Then
    GetNextAvailableBib = Empty
    Exit Function
  End If

  For bibNum = bibStart To bibEnd
    If Not IsBibDuplicate(bibNum, ws, currentRow) Then
      GetNextAvailableBib = bibNum
      Exit Function
    End If
  Next bibNum

  GetNextAvailableBib = Empty
End Function

Private Function IsBibValidForField(ByVal rawBib As Variant, ByVal fieldName As String, ByVal ws As Worksheet, ByVal currentRow As Long) As Boolean
  Dim bibStart As Long, bibEnd As Long
  Dim bibNum As Double

  If Not IsNumeric(rawBib) Then
    IsBibValidForField = False
    Exit Function
  End If

  bibNum = CDbl(rawBib)
  If bibNum <= 0 Or bibNum <> Fix(bibNum) Then
    IsBibValidForField = False
    Exit Function
  End If

  If Not GetBibRange(fieldName, bibStart, bibEnd) Then
    IsBibValidForField = False
    Exit Function
  End If

  If CLng(bibNum) < bibStart Or CLng(bibNum) > bibEnd Then
    IsBibValidForField = False
    Exit Function
  End If

  If IsBibDuplicate(CLng(bibNum), ws, currentRow) Then
    IsBibValidForField = False
    Exit Function
  End If

  IsBibValidForField = True
End Function

Private Function GetBibRange(ByVal fieldName As String, ByRef bibStart As Long, ByRef bibEnd As Long) As Boolean
  Dim cfg As Worksheet
  Dim r As Long
  Dim nameInCfg As String

  Set cfg = ThisWorkbook.Worksheets("Config")

  For r = 4 To 200
    nameInCfg = Trim$(CStr(cfg.Cells(r, "C").Value))
    If nameInCfg = "" Then Exit For

    If StrComp(nameInCfg, Trim$(fieldName), vbTextCompare) = 0 Then
      If IsNumeric(cfg.Cells(r, "D").Value) And IsNumeric(cfg.Cells(r, "E").Value) Then
        bibStart = CLng(cfg.Cells(r, "D").Value)
        bibEnd = CLng(cfg.Cells(r, "E").Value)
        GetBibRange = True
        Exit Function
      End If
      Exit For
    End If
  Next r

  GetBibRange = False
End Function

Private Function IsBibDuplicate(ByVal bibNum As Long, ByVal ws As Worksheet, ByVal currentRow As Long) As Boolean
  Dim r As Long
  For r = 2 To 201
    If r <> currentRow Then
      If IsNumeric(ws.Cells(r, "A").Value) Then
        If CLng(ws.Cells(r, "A").Value) = bibNum Then
          IsBibDuplicate = True
          Exit Function
        End If
      End If
    End If
  Next r

  IsBibDuplicate = False
End Function

Private Sub SortStageSheet(ByVal ws As Worksheet)
  On Error GoTo SortStageExit
  If ws Is Nothing Then Exit Sub
  Application.Calculate
  ws.Calculate

  With ws.Sort
    .SortFields.Clear
    .SortFields.Add Key:=ws.Range("L2:L251"), SortOn:=xlSortOnValues, Order:=xlAscending, DataOption:=xlSortNormal
    .SortFields.Add Key:=ws.Range("J2:J251"), SortOn:=xlSortOnValues, Order:=xlAscending, DataOption:=xlSortNormal
    .SortFields.Add Key:=ws.Range("A2:A251"), SortOn:=xlSortOnValues, Order:=xlAscending, DataOption:=xlSortNormal
    .SetRange ws.Range("A1:L201")
    .Header = xlYes
    .Apply
  End With

SortStageExit:
End Sub

Private Sub SortGC()
  On Error GoTo SortExit
  Dim ws As Worksheet, reg As Worksheet
  Set ws = ThisWorkbook.Worksheets("GC")
  Set reg = ThisWorkbook.Worksheets("Registration")

  Application.Calculate
  ws.Calculate

  ws.Unprotect Password:="race-lock"

  Dim itemCount As Long, rowIndex As Long, writeRow As Long
  Dim bibValues(1 To 200) As Variant
  Dim fieldOrders(1 To 200) As Long
  Dim statusOrders(1 To 200) As Long
  Dim totalSeconds(1 To 200) As Double

  For rowIndex = 2 To 201
    If IsNumeric(reg.Cells(rowIndex, "A").Value) Then
      If Trim$(CStr(reg.Cells(rowIndex, "D").Value)) <> "" Then
      itemCount = itemCount + 1
      bibValues(itemCount) = CLng(reg.Cells(rowIndex, "A").Value)
      fieldOrders(itemCount) = GetGCFieldOrder(CStr(reg.Cells(rowIndex, "D").Value))
      statusOrders(itemCount) = GetGCStatusOrder(GetBibGCStatus(CLng(reg.Cells(rowIndex, "A").Value)))
      totalSeconds(itemCount) = GetBibTotalSeconds(CLng(reg.Cells(rowIndex, "A").Value), statusOrders(itemCount))
      End If
    End If
  Next rowIndex

  If itemCount > 1 Then
    Dim i As Long, j As Long
    For i = 1 To itemCount - 1
      For j = i + 1 To itemCount
        If CompareGCItems(fieldOrders(i), statusOrders(i), totalSeconds(i), bibValues(i), _
                          fieldOrders(j), statusOrders(j), totalSeconds(j), bibValues(j)) > 0 Then
          SwapGCItem bibValues, fieldOrders, statusOrders, totalSeconds, i, j
        End If
      Next j
    Next i
  End If

  ws.Range("A2:M201").ClearContents

  For writeRow = 2 To 201
    Dim itemPos As Long
    itemPos = writeRow - 1
    If itemPos <= itemCount Then
      WriteGCRow ws, writeRow, bibValues(itemPos)
    End If
  Next writeRow

SortExit:
  ws.Protect Password:="race-lock", DrawingObjects:=True, Contents:=True, Scenarios:=True, _
      AllowSorting:=True, AllowFiltering:=True
End Sub

Private Function GetBibGCStatus(ByVal bibNum As Long) As String
  Dim v1 As Variant, v2 As Variant, v3 As Variant

  v1 = GetStageValueByBib("tblStage1", bibNum, "F")
  v2 = GetStageValueByBib("tblStage2", bibNum, "F")
  v3 = GetStageValueByBib("tblStage3", bibNum, "F")

  If UCase$(Trim$(CStr(v1))) = "DNS" Or UCase$(Trim$(CStr(v2))) = "DNS" Or UCase$(Trim$(CStr(v3))) = "DNS" Then
    GetBibGCStatus = "DNS"
  ElseIf UCase$(Trim$(CStr(v1))) = "DNF" Or UCase$(Trim$(CStr(v2))) = "DNF" Or UCase$(Trim$(CStr(v3))) = "DNF" Then
    GetBibGCStatus = "DNF"
  ElseIf IsNumeric(v1) And IsNumeric(v2) And IsNumeric(v3) Then
    GetBibGCStatus = "Active"
  Else
    GetBibGCStatus = "Pending"
  End If
End Function

Private Function GetBibTotalSeconds(ByVal bibNum As Long, ByVal statusOrder As Long) As Double
  Dim s1 As Variant, s2 As Variant, s3 As Variant
  s1 = GetStageValueByBib("tblStage1", bibNum, "J")
  s2 = GetStageValueByBib("tblStage2", bibNum, "J")
  s3 = GetStageValueByBib("tblStage3", bibNum, "J")

  If statusOrder = 1 And IsNumeric(s1) And IsNumeric(s2) And IsNumeric(s3) Then
    GetBibTotalSeconds = CDbl(s1) + CDbl(s2) + CDbl(s3)
  Else
    GetBibTotalSeconds = 9.9E+307
  End If
End Function

Private Function GetStageValueByBib(ByVal tableName As String, ByVal bibNum As Long, ByVal colLetter As String) As Variant
  Dim ws As Worksheet
  Dim r As Long

  Set ws = GetStageWorksheetByTable(tableName)
  If ws Is Nothing Then
    GetStageValueByBib = ""
    Exit Function
  End If

  For r = 2 To 251
    If IsNumeric(ws.Cells(r, "A").Value) Then
      If CLng(ws.Cells(r, "A").Value) = bibNum Then
        GetStageValueByBib = ws.Cells(r, colLetter).Value
        Exit Function
      End If
    End If
  Next r

  GetStageValueByBib = ""
End Function

Private Sub WriteGCRow(ByVal ws As Worksheet, ByVal rowNum As Long, ByVal bibValue As Variant)
  Dim q As String
  q = Chr$(34)

  ws.Cells(rowNum, "A").Value = bibValue
  ws.Cells(rowNum, "B").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblReg[Field],MATCH(A" & rowNum & ",tblReg[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "C").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblReg[FirstName],MATCH(A" & rowNum & ",tblReg[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "D").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblReg[LastName],MATCH(A" & rowNum & ",tblReg[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "E").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblReg[Team],MATCH(A" & rowNum & ",tblReg[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "F").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblStage1[NetTime],MATCH(A" & rowNum & ",tblStage1[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "G").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblStage2[NetTime],MATCH(A" & rowNum & ",tblStage2[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "H").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblStage3[NetTime],MATCH(A" & rowNum & ",tblStage3[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "I").Formula = "=IF(COUNTA(F" & rowNum & ":H" & rowNum & ")=3,SUM(F" & rowNum & ":H" & rowNum & ")*86400," & q & q & ")"
  ws.Cells(rowNum, "J").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IF(SUM(IFERROR(INDEX(tblStage1[BonusSeconds],MATCH(A" & rowNum & ",tblStage1[Bib],0)),0),IFERROR(INDEX(tblStage2[BonusSeconds],MATCH(A" & rowNum & ",tblStage2[Bib],0)),0),IFERROR(INDEX(tblStage3[BonusSeconds],MATCH(A" & rowNum & ",tblStage3[Bib],0)),0))=0," & q & q & ",SUM(IFERROR(INDEX(tblStage1[BonusSeconds],MATCH(A" & rowNum & ",tblStage1[Bib],0)),0),IFERROR(INDEX(tblStage2[BonusSeconds],MATCH(A" & rowNum & ",tblStage2[Bib],0)),0),IFERROR(INDEX(tblStage3[BonusSeconds],MATCH(A" & rowNum & ",tblStage3[Bib],0)),0))/86400))"
  ws.Cells(rowNum, "K").Formula = "=IF(I" & rowNum & "=" & q & q & "," & q & q & ",I" & rowNum & "/86400)"
  ws.Cells(rowNum, "L").Value = GetBibGCStatus(CLng(bibValue))
  ws.Cells(rowNum, "M").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IF(L" & rowNum & "=" & q & "Active" & q & ",1+COUNTIFS($B$2:$B$201,B" & rowNum & ",$L$2:$L$201," & q & "Active" & q & ",$I$2:$I$201," & q & "<" & q & "&I" & rowNum & "),IF(L" & rowNum & "=" & q & "Pending" & q & ",COUNTIFS($B$2:$B$201,B" & rowNum & ",$L$2:$L$201," & q & "Active" & q & ")+COUNTIFS($B$2:$B$201,B" & rowNum & ",$L$2:$L$201," & q & "Pending" & q & ",$A$2:$A$201," & q & "<" & q & "&A" & rowNum & ")+1," & q & q & ")))"
  ws.Cells(rowNum, "F").NumberFormat = "hh:mm:ss"
  ws.Cells(rowNum, "G").NumberFormat = "hh:mm:ss"
  ws.Cells(rowNum, "H").NumberFormat = "hh:mm:ss"
  ws.Cells(rowNum, "J").NumberFormat = """-""hh:mm:ss"
  ws.Cells(rowNum, "K").NumberFormat = "hh:mm:ss"
End Sub

Private Function GetGCFieldOrder(ByVal fieldValue As String) As Long
  Dim configSheet As Worksheet
  Dim configRow As Long
  Dim candidate As String

  Set configSheet = ThisWorkbook.Worksheets("Config")
  For configRow = 4 To 7
    candidate = CStr(configSheet.Cells(configRow, "A").Value)
    If StrComp(Trim$(candidate), Trim$(fieldValue), vbTextCompare) = 0 Then
      GetGCFieldOrder = configRow - 3
      Exit Function
    End If
  Next configRow

  GetGCFieldOrder = 999
End Function

Private Function GetGCStatusOrder(ByVal statusValue As String) As Long
  Select Case UCase$(Trim$(statusValue))
    Case "ACTIVE"
      GetGCStatusOrder = 1
    Case "PENDING"
      GetGCStatusOrder = 2
    Case "DNF"
      GetGCStatusOrder = 3
    Case "DNS"
      GetGCStatusOrder = 4
    Case Else
      GetGCStatusOrder = 9
  End Select
End Function

Private Function GetNumericCellValue(ByVal cell As Range, ByVal fallbackValue As Double) As Double
  If IsNumeric(cell.Value) Then
    GetNumericCellValue = CDbl(cell.Value)
  Else
    GetNumericCellValue = fallbackValue
  End If
End Function

Private Function CompareGCItems(ByVal fieldA As Long, ByVal statusA As Long, ByVal timeA As Double, ByVal bibA As Variant, _
                                ByVal fieldB As Long, ByVal statusB As Long, ByVal timeB As Double, ByVal bibB As Variant) As Long
  If fieldA <> fieldB Then
    CompareGCItems = Sgn(fieldA - fieldB)
    Exit Function
  End If

  If statusA <> statusB Then
    CompareGCItems = Sgn(statusA - statusB)
    Exit Function
  End If

  If timeA <> timeB Then
    CompareGCItems = Sgn(timeA - timeB)
    Exit Function
  End If

  CompareGCItems = Sgn(CDbl(bibA) - CDbl(bibB))
End Function

Private Sub SwapGCItem(ByRef bibValues() As Variant, ByRef fieldOrders() As Long, ByRef statusOrders() As Long, ByRef totalSeconds() As Double, _
                       ByVal indexA As Long, ByVal indexB As Long)
  Dim tempBib As Variant, tempField As Long, tempStatus As Long, tempTime As Double

  tempBib = bibValues(indexA)
  tempField = fieldOrders(indexA)
  tempStatus = statusOrders(indexA)
  tempTime = totalSeconds(indexA)

  bibValues(indexA) = bibValues(indexB)
  fieldOrders(indexA) = fieldOrders(indexB)
  statusOrders(indexA) = statusOrders(indexB)
  totalSeconds(indexA) = totalSeconds(indexB)

  bibValues(indexB) = tempBib
  fieldOrders(indexB) = tempField
  statusOrders(indexB) = tempStatus
  totalSeconds(indexB) = tempTime
End Sub

Private Sub EnsureSortButton(ByVal ws As Worksheet)
  On Error GoTo BtnExit

  Dim btnName As String
  btnName = "btnManualReorder"

  Dim publishBtnName As String
  publishBtnName = "btnPublishResults"

  ws.Unprotect Password:="race-lock"
  On Error Resume Next
  ws.Shapes(btnName).Delete
  ws.Shapes(publishBtnName).Delete
  On Error GoTo BtnExit

  Dim btn As Shape
  Set btn = ws.Shapes.AddShape(msoShapeRoundedRectangle, ws.Range("N1").Left, ws.Range("N2").Top + 2, 160, 32)
  btn.Name = btnName

  ' Prefer TextFrame2 when available; fall back to legacy TextFrame for compatibility.
  On Error Resume Next
  btn.TextFrame2.TextRange.Text = "Recalculate"
  btn.TextFrame2.TextRange.Font.Size = 11
  btn.TextFrame2.TextRange.Font.Bold = msoTrue
  btn.TextFrame2.VerticalAnchor = msoAnchorMiddle
  If Err.Number <> 0 Then
    Err.Clear
    btn.TextFrame.Characters.Text = "Recalculate"
    btn.TextFrame.HorizontalAlignment = xlHAlignCenter
    btn.TextFrame.VerticalAlignment = xlVAlignCenter
  End If
  On Error GoTo BtnExit

  btn.Fill.ForeColor.RGB = RGB(22, 86, 149)
  btn.Line.Visible = msoFalse

  On Error Resume Next
  btn.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
  On Error GoTo BtnExit
  If ws.Name = "GC" Then
    btn.OnAction = "'" & ThisWorkbook.Name & "'!ManualReorderGC"

    Dim publishBtn As Shape
    Set publishBtn = ws.Shapes.AddShape(msoShapeRoundedRectangle, ws.Range("P1").Left, ws.Range("P2").Top + 2, 140, 32)
    publishBtn.Name = publishBtnName
    On Error Resume Next
    publishBtn.TextFrame2.TextRange.Text = "Publish"
    publishBtn.TextFrame2.TextRange.Font.Size = 11
    publishBtn.TextFrame2.TextRange.Font.Bold = msoTrue
    publishBtn.TextFrame2.VerticalAnchor = msoAnchorMiddle
    If Err.Number <> 0 Then
      Err.Clear
      publishBtn.TextFrame.Characters.Text = "Publish"
      publishBtn.TextFrame.HorizontalAlignment = xlHAlignCenter
      publishBtn.TextFrame.VerticalAlignment = xlVAlignCenter
    End If
    On Error GoTo BtnExit

    publishBtn.Fill.ForeColor.RGB = RGB(16, 124, 65)
    publishBtn.Line.Visible = msoFalse
    On Error Resume Next
    publishBtn.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
    On Error GoTo BtnExit
    publishBtn.OnAction = "'" & ThisWorkbook.Name & "'!PublishRaceResultsAction"
  Else
    btn.OnAction = "'" & ThisWorkbook.Name & "'!ManualReorderStage"
  End If

BtnExit:
  ws.Protect Password:="race-lock", DrawingObjects:=True, Contents:=True, Scenarios:=True, _
      AllowSorting:=True, AllowFiltering:=True
  If IsStageWorksheet(ws) Then
    ws.EnableSelection = xlUnlockedCells
  End If
End Sub

Public Sub PublishRaceResultsCore()
  On Error GoTo PublishFail

  Dim accessCode As String
  accessCode = Trim$(InputBox("Enter publish access code:", "Publish Access"))
  If accessCode = "" Then Exit Sub
  If accessCode <> "2068514132" Then
    MsgBox "Invalid publish access code.", vbExclamation
    Exit Sub
  End If

  ' Ensure dependent formulas (net time/place/gc) are current before exporting.
  Application.CalculateFull

  Dim payload As String
  payload = BuildPublishPayloadJson(accessCode)

  Dim http As Object
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")

  Dim endpoint As String
  endpoint = "https://www.nomadcyclingclub.com/api/race-admin/excelPublish"

  http.Open "POST", endpoint, False
  http.setRequestHeader "Content-Type", "application/json"
  http.send payload

  If http.Status >= 200 And http.Status < 300 Then
    MsgBox "Race results published successfully to www.nomadcyclingclub.com/raceresults2026", vbInformation
  Else
    MsgBox "Publish failed (" & CStr(http.Status) & "): " & Left$(CStr(http.responseText), 500), vbCritical
  End If
  Exit Sub

PublishFail:
  MsgBox "Publish failed: " & Err.Description, vbCritical
End Sub

Private Function BuildPublishPayloadJson(ByVal accessCode As String) As String
  Dim stage1 As Worksheet, stage2 As Worksheet, stage3 As Worksheet
  Set stage1 = GetStageWorksheetByTable("tblStage1")
  Set stage2 = GetStageWorksheetByTable("tblStage2")
  Set stage3 = GetStageWorksheetByTable("tblStage3")

  Dim gc As Worksheet
  Set gc = ThisWorkbook.Worksheets("GC")

  Dim eventName As String
  eventName = "Nomad Stage Race 2026"
  On Error Resume Next
  If Trim$(CStr(ThisWorkbook.Worksheets("Config").Range("A1").Value)) <> "" Then
    eventName = CStr(ThisWorkbook.Worksheets("Config").Range("A1").Value)
  End If
  On Error GoTo 0

  Dim json As String
  json = "{" & _
    """publisherEmail"":""" & JsonEscape("racepublisher@nomadcyclingclub.com") & """," & _
    """publishPassword"":""" & JsonEscape(accessCode) & """," & _
    """eventName"":""" & JsonEscape(eventName) & """," & _
    """publishedAt"":""" & JsonEscape(Format$(Now, "yyyy-mm-dd\THH:nn:ss")) & """," & _
    """stageTables"": [" & _
      BuildStagePublishJson(stage1, "Group Stage", gc) & "," & _
      BuildStagePublishJson(stage2, "TT Stage", gc) & "," & _
      BuildStagePublishJson(stage3, "Mountain Stage", gc) & _
    "]," & _
    """gc"": " & BuildGCPublishJson(gc) & _
  "}"

  BuildPublishPayloadJson = json
End Function

Private Function BuildStagePublishJson(ByVal ws As Worksheet, ByVal stageName As String, ByVal gcWs As Worksheet) As String
  If ws Is Nothing Then
    BuildStagePublishJson = "{""stageName"":""" & JsonEscape(stageName) & """,""entries"":[]}"
    Exit Function
  End If

  Dim rowIndex As Long
  Dim placeValue As Long
  Dim chunks As String
  placeValue = 0
  chunks = ""

  For rowIndex = 2 To 251
    If IsNumeric(ws.Cells(rowIndex, "A").Value) Then
      Dim bibValue As Long
      bibValue = CLng(ws.Cells(rowIndex, "A").Value)

      Dim riderName As String
      riderName = Trim$(CStr(ws.Cells(rowIndex, "C").Value) & " " & CStr(ws.Cells(rowIndex, "D").Value))

      Dim teamName As String
      teamName = CStr(ws.Cells(rowIndex, "E").Value)

      Dim fieldName As String
      fieldName = CStr(ws.Cells(rowIndex, "B").Value)

      Dim statusText As String
      statusText = UCase$(Trim$(CStr(ws.Cells(rowIndex, "F").Value)))

      Dim placePart As String
      placePart = "null"

      Dim elapsedPart As String
      elapsedPart = "null"

      Dim bonusPart As String
      bonusPart = "0"
      If IsNumeric(ws.Cells(rowIndex, "I").Value) Then
        bonusPart = CStr(CLng(CDbl(ws.Cells(rowIndex, "I").Value)))
      End If

      If statusText = "DNF" Or statusText = "DNS" Then
        ' DNF/DNS must never carry stale numeric values from formula lag.
        placePart = "null"
        elapsedPart = "null"
      ElseIf IsNumeric(ws.Cells(rowIndex, "J").Value) Then
        placeValue = placeValue + 1
        placePart = CStr(placeValue)
        elapsedPart = CStr(CLng(CDbl(ws.Cells(rowIndex, "J").Value) * 1000#))
        statusText = "FIN"
      Else
        statusText = "NO_TIME"
      End If

      Dim gcRankPart As String
      Dim gcElapsedPart As String
      gcRankPart = "null"
      gcElapsedPart = "null"
      Call ResolveGcForBib(gcWs, bibValue, gcRankPart, gcElapsedPart)

      If chunks <> "" Then chunks = chunks & ","
      chunks = chunks & "{" & _
        """place"":" & placePart & "," & _
        """bib"":" & CStr(bibValue) & "," & _
        """fieldName"":""" & JsonEscape(fieldName) & """," & _
        """riderName"":""" & JsonEscape(riderName) & """," & _
        """team"":""" & JsonEscape(teamName) & """," & _
        """resultStatus"":""" & JsonEscape(statusText) & """," & _
        """elapsedMs"":" & elapsedPart & "," & _
        """bonusSec"":" & bonusPart & "," & _
        """gcRank"":" & gcRankPart & "," & _
        """gcElapsedMs"":" & gcElapsedPart & _
      "}"
    End If
  Next rowIndex

  BuildStagePublishJson = "{" & _
    """stageName"":""" & JsonEscape(stageName) & """," & _
    """entries"": [" & chunks & "]" & _
  "}"
End Function

Private Sub ResolveGcForBib(ByVal gcWs As Worksheet, ByVal bibValue As Long, ByRef gcRankPart As String, ByRef gcElapsedPart As String)
  gcRankPart = "null"
  gcElapsedPart = "null"

  If gcWs Is Nothing Then Exit Sub

  Dim rowIndex As Long
  For rowIndex = 2 To 201
    If IsNumeric(gcWs.Cells(rowIndex, "A").Value) Then
      If CLng(gcWs.Cells(rowIndex, "A").Value) = bibValue Then
        If IsNumeric(gcWs.Cells(rowIndex, "M").Value) Then
          gcRankPart = CStr(CLng(gcWs.Cells(rowIndex, "M").Value))
        End If
        If IsNumeric(gcWs.Cells(rowIndex, "I").Value) Then
          gcElapsedPart = CStr(CLng(CDbl(gcWs.Cells(rowIndex, "I").Value) * 1000#))
        End If
        Exit For
      End If
    End If
  Next rowIndex
End Sub
Private Function BuildGCPublishJson(ByVal ws As Worksheet) As String
  Dim rowIndex As Long
  Dim chunks As String
  chunks = ""

  For rowIndex = 2 To 201
    If IsNumeric(ws.Cells(rowIndex, "A").Value) Then
      If UCase$(Trim$(CStr(ws.Cells(rowIndex, "L").Value))) = "ACTIVE" And IsNumeric(ws.Cells(rowIndex, "I").Value) Then
        Dim rankValue As Long
        rankValue = 0
        If IsNumeric(ws.Cells(rowIndex, "M").Value) Then rankValue = CLng(ws.Cells(rowIndex, "M").Value)

        Dim elapsedMs As Double
        elapsedMs = CDbl(ws.Cells(rowIndex, "I").Value) * 1000#

        If chunks <> "" Then chunks = chunks & ","
        chunks = chunks & "{" & _
          """rank"":" & CStr(rankValue) & "," & _
          """bib"":" & CStr(CLng(ws.Cells(rowIndex, "A").Value)) & "," & _
          """riderName"":""" & JsonEscape(Trim$(CStr(ws.Cells(rowIndex, "C").Value) & " " & CStr(ws.Cells(rowIndex, "D").Value))) & """," & _
          """team"":""" & JsonEscape(CStr(ws.Cells(rowIndex, "E").Value)) & """," & _
          """stagesCompleted"": 3," & _
          """elapsedMs"":" & CStr(CLng(elapsedMs)) & _
        "}"
      End If
    End If
  Next rowIndex

  BuildGCPublishJson = "[" & chunks & "]"
End Function

Private Function JsonEscape(ByVal value As String) As String
  Dim textValue As String
  textValue = value
  textValue = Replace(textValue, "\", Chr$(92) & Chr$(92))
  textValue = Replace(textValue, """", Chr$(92) & Chr$(34))
  textValue = Replace(textValue, vbCrLf, Chr$(92) & "n")
  textValue = Replace(textValue, vbCr, Chr$(92) & "n")
  textValue = Replace(textValue, vbLf, Chr$(92) & "n")
  JsonEscape = textValue
End Function

Private Function ExtractJsonString(ByVal jsonText As String, ByVal keyName As String) As String
  Dim token As String
  token = """" & keyName & """:"""

  Dim startPos As Long
  startPos = InStr(1, jsonText, token, vbTextCompare)
  If startPos = 0 Then
    ExtractJsonString = ""
    Exit Function
  End If

  startPos = startPos + Len(token)
  Dim endPos As Long
  endPos = InStr(startPos, jsonText, """")
  If endPos = 0 Then
    ExtractJsonString = ""
    Exit Function
  End If

  ExtractJsonString = Mid$(jsonText, startPos, endPos - startPos)
End Function

Private Function HasTable(ByVal ws As Worksheet, ByVal tableName As String) As Boolean
  On Error Resume Next
  HasTable = Not (ws.ListObjects(tableName) Is Nothing)
  On Error GoTo 0
End Function

Private Function IsStageWorksheet(ByVal ws As Worksheet) As Boolean
  IsStageWorksheet = HasTable(ws, "tblStage1") Or HasTable(ws, "tblStage2") Or HasTable(ws, "tblStage3")
End Function

Private Function GetStageWorksheetByTable(ByVal tableName As String) As Worksheet
  Dim ws As Worksheet

  For Each ws In ThisWorkbook.Worksheets
    If HasTable(ws, tableName) Then
      Set GetStageWorksheetByTable = ws
      Exit Function
    End If
  Next ws

  Set GetStageWorksheetByTable = Nothing
End Function

Private Sub InitializeStageSheet(ByVal ws As Worksheet)
  On Error GoTo InitExit
  Dim i As Long
  ws.Unprotect Password:="race-lock"

  For i = 2 To 251
    ws.Cells(i, "A").Value = ""
  Next i

  For i = 2 To 201
    ws.Cells(i, "A").Value = ThisWorkbook.Worksheets("Registration").Cells(i, "A").Value
  Next i

InitExit:
  ws.Protect Password:="race-lock", DrawingObjects:=True, Contents:=True, Scenarios:=True, _
      AllowSorting:=True, AllowFiltering:=True
  ws.EnableSelection = xlUnlockedCells
End Sub

Private Function NormalizeStageEntry(ByVal rawValue As Variant, ByRef normalizedValue As Variant) As Boolean
  Dim textValue As String
  textValue = Trim(CStr(rawValue))

  If textValue = "" Then
    normalizedValue = ""
    NormalizeStageEntry = True
    Exit Function
  End If

  textValue = UCase$(textValue)
  If textValue = "DNF" Or textValue = "DNS" Then
    normalizedValue = textValue
    NormalizeStageEntry = True
    Exit Function
  End If

  If IsNumeric(rawValue) Then
    Dim numValue As Double
    numValue = CDbl(rawValue)

    If numValue >= 0 And numValue < 1 Then
      normalizedValue = numValue
      NormalizeStageEntry = True
      Exit Function
    End If

    If numValue < 0 Then
      NormalizeStageEntry = False
      Exit Function
    End If

    Dim digits As String
    digits = CStr(CLng(Fix(numValue)))
    If Len(digits) > 6 Then
      NormalizeStageEntry = False
      Exit Function
    End If

    Dim hh As Long, mm As Long, ss As Long
    ss = CLng(Right$(digits, 2))
    If Len(digits) > 2 Then
      mm = CLng(Mid$(digits, Len(digits) - 3, 2))
    Else
      mm = 0
    End If
    If Len(digits) > 4 Then
      hh = CLng(Left$(digits, Len(digits) - 4))
    Else
      hh = 0
    End If

    If mm >= 60 Or ss >= 60 Then
      NormalizeStageEntry = False
      Exit Function
    End If

    normalizedValue = (hh * 3600# + mm * 60# + ss) / 86400#
    NormalizeStageEntry = True
    Exit Function
  End If

  On Error Resume Next
  normalizedValue = TimeValue(textValue)
  If Err.Number = 0 Then
    NormalizeStageEntry = True
  Else
    NormalizeStageEntry = False
  End If
  On Error GoTo 0
End Function
