VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "ThisWorkbook"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Option Explicit

Private Sub Workbook_Open()
  ' Keep Enter from moving the selection ΓÇö navigation is handled by Workbook_SheetChange.
  Application.MoveAfterReturn = False
  ProtectWorkbookStructure

  Dim ws As Worksheet
  For Each ws In ThisWorkbook.Worksheets
    ConfigureSheetEditLocks ws
    ApplyWorksheetUserProtection ws

    If IsStageWorksheet(ws) Then
      InitializeStageSheet ws
      ws.EnableSelection = xlUnlockedCells
      EnsureSortButton ws
      EnsureUpdateTimeButton ws
      EnsureActionButtonViewport ws
    ElseIf ws.Name = "Registration" Then
      EnsureRegistrationColumnHeader ws
      EnsureRegistrationSyncButton ws
      EnsureRegistrationViewport ws
    ElseIf ws.Name = "GC" Then
      EnsureSortButton ws
      EnsureActionButtonViewport ws
    End If
  Next ws
  SortGC
  AutoFitRaceColumns
  HideRawSecondsColumnsAcrossWorkbook
End Sub

Private Sub Workbook_SheetSelectionChange(ByVal Sh As Object, ByVal Target As Range)
  ' When cursor lands on column D (Field) of Registration, auto-open the dropdown.
  If Sh.Name <> "Registration" Then Exit Sub
  If Target.CountLarge > 1 Then Exit Sub
  If Target.Column <> 4 Then Exit Sub
  If Target.Row < 2 Or Target.Row > 201 Then Exit Sub
  On Error Resume Next
  Application.SendKeys "%{Down}"
End Sub

Private Sub Workbook_SheetActivate(ByVal Sh As Object)
  On Error Resume Next

  If TypeName(Sh) = "Worksheet" Then
    If Sh.Name = "GC" Or IsStageWorksheet(Sh) Then
      EnsureSortButton Sh
      If IsStageWorksheet(Sh) Then EnsureUpdateTimeButton Sh
      EnsureActionButtonViewport Sh
    ElseIf Sh.Name = "Registration" Then
      EnsureRegistrationColumnHeader Sh
      EnsureRegistrationSyncButton Sh
      EnsureRegistrationViewport Sh
    End If
  End If
End Sub

Public Sub RefreshRaceSorts()
  On Error Resume Next
  RecalculateAllSheetsCore True
End Sub

Public Sub SyncRegistrationFromGoogleSheetCore()
  On Error GoTo SyncFail

  Dim prevScreenUpdating As Boolean
  Dim prevEnableEvents As Boolean
  Dim prevCalculation As XlCalculation
  Dim googleCsvUrl As String
  Dim http As Object
  Dim csvText As String
  Dim lines As Variant
  Dim lineIndex As Long
  Dim importedCount As Long
  Dim updatedExistingCount As Long
  Dim skippedDuplicateCount As Long
  Dim skippedInvalidCount As Long
  Dim registeredCount As Long
  Dim nextRow As Long

  googleCsvUrl = "https://docs.google.com/spreadsheets/d/1TAKqNwmCDRKPEAKHFv0PrmCPiGly7bPacp7HqTw2id4/export?format=csv&gid=276157338"

  prevScreenUpdating = Application.ScreenUpdating
  prevEnableEvents = Application.EnableEvents
  prevCalculation = Application.Calculation

  Application.ScreenUpdating = False
  Application.EnableEvents = False
  Application.Calculation = xlCalculationManual

  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  http.Open "GET", googleCsvUrl, False
  http.setRequestHeader "Accept", "text/csv"
  http.send

  If http.Status < 200 Or http.Status >= 300 Then
    Err.Raise vbObjectError + 513, "SyncRegistrationFromGoogleSheetCore", "Google export request failed (" & CStr(http.Status) & ")."
  End If

  csvText = CStr(http.responseText)
  csvText = Replace(csvText, vbCrLf, vbLf)
  csvText = Replace(csvText, vbCr, vbLf)
  lines = Split(csvText, vbLf)

  Dim registrationWs As Worksheet
  Set registrationWs = ThisWorkbook.Worksheets("Registration")

  Dim rowText As String
  Dim rowValues As Variant
  Dim headerValues As Variant
  Dim timestampColumnIndex As Long
  Dim firstName As String, lastName As String, participantType As String, ageCategory As String, teamName As String, registeredDate As String
  Dim fieldName As String, duplicateRow As Long

  EnsureRegistrationColumnHeader registrationWs

  headerValues = ParseCsvLineToArray(CStr(lines(0)))
  timestampColumnIndex = FindCsvHeaderIndex(headerValues, "Timestamp")
  If timestampColumnIndex = 0 Then timestampColumnIndex = 1

  For lineIndex = 1 To UBound(lines)
    rowText = Trim$(CStr(lines(lineIndex)))
    If rowText = "" Then GoTo NextCsvRow

    rowValues = ParseCsvLineToArray(rowText)
    If IsEmpty(rowValues) Then GoTo NextCsvRow
    If UBound(rowValues) < 8 Then GoTo NextCsvRow

    firstName = Trim$(CsvFieldValue(rowValues, 2))
    lastName = Trim$(CsvFieldValue(rowValues, 3))
    participantType = UCase$(Trim$(CsvFieldValue(rowValues, 4)))
    ageCategory = Trim$(CsvFieldValue(rowValues, 8))
    teamName = Trim$(CsvFieldValue(rowValues, 9))
    registeredDate = Trim$(CsvFieldValue(rowValues, timestampColumnIndex))

    If firstName = "" Or lastName = "" Then
      skippedInvalidCount = skippedInvalidCount + 1
      GoTo NextCsvRow
    End If

    If participantType = "FAMILY MEMBER" Then
      GoTo NextCsvRow
    End If

    fieldName = MapGoogleAgeCategoryToField(ageCategory)
    If fieldName = "" Then
      skippedInvalidCount = skippedInvalidCount + 1
      GoTo NextCsvRow
    End If

    duplicateRow = FindRegistrationDuplicateRow(registrationWs, firstName, lastName, fieldName)
    If duplicateRow > 0 Then
      If registeredDate <> "" Then
        If Trim$(CStr(registrationWs.Cells(duplicateRow, "F").Value)) <> registeredDate Then
          registrationWs.Cells(duplicateRow, "F").Value = registeredDate
          updatedExistingCount = updatedExistingCount + 1
        End If
      End If
      skippedDuplicateCount = skippedDuplicateCount + 1
      GoTo NextCsvRow
    End If

    nextRow = FindNextEmptyRegistrationRow(registrationWs)
    If nextRow = 0 Then
      Err.Raise vbObjectError + 514, "SyncRegistrationFromGoogleSheetCore", "Registration sheet is full."
    End If

    registrationWs.Cells(nextRow, "A").Value = GetNextAvailableBib(fieldName, registrationWs, nextRow)
    registrationWs.Cells(nextRow, "B").Value = firstName
    registrationWs.Cells(nextRow, "C").Value = lastName
    registrationWs.Cells(nextRow, "D").Value = fieldName
    registrationWs.Cells(nextRow, "E").Value = teamName
    registrationWs.Cells(nextRow, "F").Value = registeredDate

    importedCount = importedCount + 1

NextCsvRow:
  Next lineIndex

  RecalculateAllSheetsCore True
  AutoFitRaceColumns
  HideRawSecondsColumnsAcrossWorkbook
  EnsureRegistrationColumnHeader ThisWorkbook.Worksheets("Registration")
  EnsureRegistrationSyncButton ThisWorkbook.Worksheets("Registration")

  MsgBox "Google sync complete." & vbCrLf & _
         "Imported: " & CStr(importedCount) & vbCrLf & _
      "Existing updated: " & CStr(updatedExistingCount) & vbCrLf & _
         "Duplicates skipped: " & CStr(skippedDuplicateCount) & vbCrLf & _
         "Invalid rows skipped: " & CStr(skippedInvalidCount), vbInformation, "Sync Riders"

SyncExit:
  On Error Resume Next
  Application.Calculation = prevCalculation
  Application.EnableEvents = prevEnableEvents
  Application.ScreenUpdating = prevScreenUpdating
  Exit Sub

SyncFail:
  MsgBox "Google sync failed: " & Err.Description, vbCritical, "Sync Riders"
  Resume SyncExit
End Sub

Public Sub RecalculateAllSheetsCore(Optional ByVal skipUiPass As Boolean = False)
  On Error GoTo RecalcExit

  Dim uiSheetName As String
  Dim uiSelectionAddress As String
  Dim hasUIContext As Boolean
  Dim prevScreenUpdating As Boolean
  Dim prevCalculation As XlCalculation

  If Not ActiveSheet Is Nothing Then
    uiSheetName = ActiveSheet.Name
    If TypeName(Selection) = "Range" Then
      uiSelectionAddress = Selection.Address(False, False)
      hasUIContext = True
    End If
  End If

  prevScreenUpdating = Application.ScreenUpdating
  prevCalculation = Application.Calculation

  Application.EnableEvents = False
  Application.ScreenUpdating = False
  Application.Calculation = xlCalculationManual

  SyncAllStageSheetsFromRegistration
  EnsureStageDerivedFormulas GetStageWorksheetByTable("tblStage1")
  EnsureStageDerivedFormulas GetStageWorksheetByTable("tblStage2")
  EnsureStageDerivedFormulas GetStageWorksheetByTable("tblStage3")
  SortStageSheet GetStageWorksheetByTable("tblStage1")
  SortStageSheet GetStageWorksheetByTable("tblStage2")
  SortStageSheet GetStageWorksheetByTable("tblStage3")
  EnforceStageDerivedClears GetStageWorksheetByTable("tblStage1")
  EnforceStageDerivedClears GetStageWorksheetByTable("tblStage2")
  EnforceStageDerivedClears GetStageWorksheetByTable("tblStage3")
  SortGC
  If Not skipUiPass Then
    AutoFitRaceColumns
    HideRawSecondsColumnsAcrossWorkbook
  End If

  CompactRegistrationRows ThisWorkbook.Worksheets("Registration")

  If hasUIContext Then
    On Error Resume Next
    ThisWorkbook.Worksheets(uiSheetName).Activate
    ThisWorkbook.Worksheets(uiSheetName).Range(uiSelectionAddress).Select
    On Error GoTo RecalcExit
  End If

RecalcExit:
  On Error Resume Next
  Application.Calculation = prevCalculation
  Application.ScreenUpdating = prevScreenUpdating
  Application.EnableEvents = True
End Sub

Private Sub HideRawSecondsColumnsAcrossWorkbook()
  On Error GoTo HideExit

  Dim ws As Worksheet
  For Each ws In ThisWorkbook.Worksheets
    HideRawSecondsColumnsOnSheet ws
  Next ws

HideExit:
End Sub

Private Sub HideRawSecondsColumnsOnSheet(ByVal ws As Worksheet)
  On Error GoTo SheetExit

  If ws Is Nothing Then Exit Sub

  Dim wasProtected As Boolean
  Dim usedPassword As String
  wasProtected = ws.ProtectContents

  If wasProtected Then
    If Not TryUnprotectStageWorksheet(ws, usedPassword) Then Exit Sub
  End If

  Dim lo As ListObject
  Dim lc As ListColumn
  Dim colName As String
  For Each lo In ws.ListObjects
    For Each lc In lo.ListColumns
      colName = LCase$(Trim$(CStr(lc.Name)))

      ' Keep bonus-seconds visible; only hide raw stage-time seconds columns.
      If colName = "stageseconds" Or colName = "rawseconds" Or colName = "netseconds" Or colName = "sortkey" Then
        lc.Range.EntireColumn.Hidden = True
      ElseIf colName = "bonusseconds" Then
        lc.Range.EntireColumn.Hidden = False
      End If
    Next lc
  Next lo

SheetExit:
  On Error Resume Next
  If Not ws Is Nothing Then
    If wasProtected Then
      ProtectStageWorksheet ws, usedPassword
    End If
  End If
End Sub

Private Sub PurgeDeletedRidersFromStageSheets()
  PurgeDeletedRidersOnStageSheet GetStageWorksheetByTable("tblStage1")
  PurgeDeletedRidersOnStageSheet GetStageWorksheetByTable("tblStage2")
  PurgeDeletedRidersOnStageSheet GetStageWorksheetByTable("tblStage3")
End Sub

Private Sub PurgeDeletedRidersOnStageSheet(ByVal ws As Worksheet)
  On Error GoTo PurgeExit

  If ws Is Nothing Then Exit Sub

  Dim wasProtected As Boolean
  Dim usedPassword As String
  Dim rowIndex As Long
  Dim bibValue As Variant

  wasProtected = ws.ProtectContents
  If wasProtected Then
    If Not TryUnprotectStageWorksheet(ws, usedPassword) Then Exit Sub
  End If

  For rowIndex = 2 To 251
    bibValue = ws.Cells(rowIndex, "A").Value
    If IsNumeric(bibValue) Then
      If Not RegistrationContainsBib(CLng(CDbl(bibValue))) Then
        ws.Range("A" & rowIndex & ":L" & rowIndex).ClearContents
      End If
    End If
  Next rowIndex

PurgeExit:
  On Error Resume Next
  If Not ws Is Nothing Then
    If wasProtected Then
      ProtectStageWorksheet ws, usedPassword
    End If
    ws.EnableSelection = xlUnlockedCells
  End If
End Sub

Private Function RegistrationContainsBib(ByVal bibNumber As Long) As Boolean
  Dim regWs As Worksheet
  Dim rowIndex As Long
  Dim rawBib As Variant

  Set regWs = ThisWorkbook.Worksheets("Registration")
  For rowIndex = 2 To 201
    rawBib = regWs.Cells(rowIndex, "A").Value
    If IsNumeric(rawBib) Then
      If CLng(CDbl(rawBib)) = bibNumber Then
        RegistrationContainsBib = True
        Exit Function
      End If
    End If
  Next rowIndex
End Function

Private Sub AutoFitRaceColumns()
  On Error GoTo FitExit

  AutoFitSheetColumnsSafe ThisWorkbook.Worksheets("Registration"), "A:F"
  AutoFitSheetColumnsSafe GetStageWorksheetByTable("tblStage1"), "A:M"
  AutoFitSheetColumnsSafe GetStageWorksheetByTable("tblStage2"), "A:M"
  AutoFitSheetColumnsSafe GetStageWorksheetByTable("tblStage3"), "A:M"
  AutoFitSheetColumnsSafe ThisWorkbook.Worksheets("GC"), "A:M"

FitExit:
End Sub

Private Sub AutoFitSheetColumnsSafe(ByVal ws As Worksheet, ByVal colRange As String)
  On Error GoTo AutoFitExit

  If ws Is Nothing Then Exit Sub

  Dim wasProtected As Boolean
  Dim usedPassword As String

  wasProtected = ws.ProtectContents
  If wasProtected Then
    If Not TryUnprotectStageWorksheet(ws, usedPassword) Then Exit Sub
  End If

  ws.Columns(colRange).EntireColumn.AutoFit

AutoFitExit:
  On Error Resume Next
  If Not ws Is Nothing Then
    If wasProtected Then
      ProtectStageWorksheet ws, usedPassword
    End If
  End If
End Sub

Public Sub ManualReorderStageCurrentSheetCore()
  RecalculateAllSheetsCore True
End Sub

Public Sub ManualReorderGCCurrentSheetCore()
  RecalculateAllSheetsCore True
End Sub

Public Sub UpdateStageTimeCurrentSheetCore(Optional ByVal presetBib As String = "", Optional ByVal presetTime As String = "", Optional ByVal presetSeq As String = "")
  On Error GoTo UpdateExit

  If ActiveSheet Is Nothing Then Exit Sub
  If TypeName(ActiveSheet) <> "Worksheet" Then Exit Sub

  Dim ws As Worksheet
  Set ws = ActiveSheet

  If Not IsStageWorksheet(ws) Then
    MsgBox "Update Time is only available on stage sheets.", vbExclamation, "Update Time"
    Exit Sub
  End If

  Dim bibInput As String, sequenceInput As String, timeInput As String
  Dim bibValue As Long, sequenceValue As Long, rowIndex As Long, nextRow As Long
  Dim stageTimeValue As Double, adjustedTimeValue As Double
  Dim fieldName As String
  Dim defaultBib As String, defaultSeq As String
  Dim stagePassword As String
  Dim wasProtected As Boolean
  Dim usePreset As Boolean
  Dim presetConsumed As Boolean

  defaultBib = ""
  defaultSeq = "1"
  usePreset = (Trim$(presetBib) <> "" And Trim$(presetTime) <> "")

  Application.EnableEvents = False
  wasProtected = ws.ProtectContents
  If wasProtected Then
    If Not TryUnprotectStageWorksheet(ws, stagePassword) Then
      MsgBox "Unable to unlock " & ws.Name & " for updates.", vbExclamation, "Update Time"
      GoTo UpdateExit
    End If
  End If

  Do
    If usePreset And Not presetConsumed Then
      bibInput = Trim$(presetBib)
    Else
      bibInput = Trim$(InputBox("Enter bib number (blank to finish):", "Update Time", defaultBib))
    End If
    If bibInput = "" Then Exit Do
    If Not IsNumeric(bibInput) Then
      MsgBox "Bib must be numeric.", vbExclamation, "Update Time"
      GoTo NextEntry
    End If

    bibValue = CLng(CDbl(bibInput))
    If bibValue <= 0 Then
      MsgBox "Bib must be greater than zero.", vbExclamation, "Update Time"
      GoTo NextEntry
    End If

    rowIndex = FindStageRowByBib(ws, bibValue)
    If rowIndex = 0 Then
      MsgBox "Bib " & CStr(bibValue) & " was not found on " & ws.Name & ".", vbExclamation, "Update Time"
      GoTo NextEntry
    End If

    sequenceValue = 1
    If StrComp(ws.Name, "TT Stage", vbTextCompare) = 0 Then
      If usePreset And Not presetConsumed Then
        sequenceInput = Trim$(presetSeq)
        If sequenceInput = "" Then sequenceInput = "1"
      Else
        sequenceInput = Trim$(InputBox("Enter TT start sequence number (1 = first rider):", "Update Time", defaultSeq))
      End If
      If sequenceInput = "" Then Exit Do
      If Not IsNumeric(sequenceInput) Then
        MsgBox "Sequence must be numeric.", vbExclamation, "Update Time"
        GoTo NextEntry
      End If

      sequenceValue = CLng(CDbl(sequenceInput))
      If sequenceValue < 1 Then
        MsgBox "Sequence must be 1 or greater.", vbExclamation, "Update Time"
        GoTo NextEntry
      End If
    End If

    If usePreset And Not presetConsumed Then
      timeInput = Trim$(presetTime)
    Else
      timeInput = Trim$(InputBox("Enter stopwatch time (hh:mm:ss.00 or compact digits):", "Update Time"))
    End If
    If timeInput = "" Then Exit Do

    If Not TryParseTimeEntry(timeInput, stageTimeValue) Then
      MsgBox "Invalid time entry. Use hh:mm:ss.00 or digits like 12345678.", vbExclamation, "Update Time"
      GoTo NextEntry
    End If

    adjustedTimeValue = stageTimeValue
    If StrComp(ws.Name, "TT Stage", vbTextCompare) = 0 Then
      adjustedTimeValue = stageTimeValue - ((sequenceValue - 1) / 1440#)
      If adjustedTimeValue < 0 Then
        MsgBox "Adjusted TT time is negative. Check the stopwatch time and sequence.", vbExclamation, "Update Time"
        GoTo NextEntry
      End If
    End If

    ws.Cells(rowIndex, "F").Value = adjustedTimeValue
    ws.Cells(rowIndex, "F").NumberFormat = GetWorkbookTimeNumberFormat()

    RecalculateStageAndGC ws

    rowIndex = FindStageRowByBib(ws, bibValue)
    If rowIndex > 0 Then
      fieldName = CStr(ws.Cells(rowIndex, "B").Value)
      nextRow = FindNextBlankStageTimeRow(ws, fieldName, rowIndex)
      If nextRow > 0 Then
        defaultBib = Trim$(CStr(ws.Cells(nextRow, "A").Value))
      Else
        defaultBib = CStr(bibValue)
      End If
    Else
      defaultBib = CStr(bibValue)
    End If

    If StrComp(ws.Name, "TT Stage", vbTextCompare) = 0 Then
      defaultSeq = CStr(sequenceValue + 1)
    End If

    If usePreset And Not presetConsumed Then
      presetConsumed = True
      Exit Do
    End If

NextEntry:
    If usePreset And Not presetConsumed Then Exit Do
  Loop

UpdateExit:
  On Error Resume Next
  If Not ws Is Nothing Then
    If wasProtected Then
      ProtectStageWorksheet ws, stagePassword
    End If
    ws.EnableSelection = xlUnlockedCells
  End If
  Application.EnableEvents = True
End Sub

Private Function TryUnprotectStageWorksheet(ByVal ws As Worksheet, ByRef usedPassword As String) As Boolean
  Dim candidates As Variant
  Dim idx As Long

  candidates = Array("2068514132", "race-lock", "")

  For idx = LBound(candidates) To UBound(candidates)
    Err.Clear
    On Error Resume Next
    ws.Unprotect Password:=CStr(candidates(idx))
    If Err.Number = 0 And Not ws.ProtectContents Then
      usedPassword = CStr(candidates(idx))
      TryUnprotectStageWorksheet = True
      Exit Function
    End If
    On Error GoTo 0
  Next idx
End Function

Private Sub ProtectStageWorksheet(ByVal ws As Worksheet, ByVal passwordValue As String)
  If passwordValue = "" Then passwordValue = "2068514132"
  ws.Protect Password:=passwordValue, DrawingObjects:=True, Contents:=True, Scenarios:=True, _
      AllowSorting:=True, AllowFiltering:=True, AllowFormattingColumns:=True, AllowFormattingRows:=False, _
      UserInterfaceOnly:=True
End Sub

Private Sub ApplyWorksheetUserProtection(ByVal ws As Worksheet)
  On Error Resume Next
  If ws Is Nothing Then Exit Sub
  ProtectStageWorksheet ws, ""
  ws.EnableSelection = xlUnlockedCells
End Sub

Private Sub ConfigureSheetEditLocks(ByVal ws As Worksheet)
  On Error GoTo LockExit

  If ws Is Nothing Then Exit Sub

  Dim usedPassword As String
  Dim wasProtected As Boolean

  wasProtected = ws.ProtectContents
  If wasProtected Then
    If Not TryUnprotectStageWorksheet(ws, usedPassword) Then Exit Sub
  End If

  ' Lock everything first, then expose only approved input cells.
  ws.Cells.Locked = True

  If ws.Name = "Registration" Then
    ws.Range("A2:F201").Locked = False
  ElseIf IsStageWorksheet(ws) Then
    ws.Range("F2:F251").Locked = False
  End If

LockExit:
  On Error Resume Next
  ProtectStageWorksheet ws, usedPassword
  ws.EnableSelection = xlUnlockedCells
End Sub

Private Sub ProtectWorkbookStructure()
  On Error Resume Next
  If Not ThisWorkbook.ProtectStructure Then
    ThisWorkbook.Protect Password:="race-lock", Structure:=True, Windows:=False
  End If
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
  Dim usedPassword As String
  Dim wasProtected As Boolean

  Set reg = ThisWorkbook.Worksheets("Registration")
  Set cfg = ThisWorkbook.Worksheets("Config")

  For r = 2 To 251
    If IsNumeric(ws.Cells(r, "A").value) Then
      existingCount = existingCount + 1
      existingBib(existingCount) = CLng(ws.Cells(r, "A").value)
      existingTime(existingCount) = ws.Cells(r, "F").value
    End If
  Next r

  wasProtected = ws.ProtectContents
  If wasProtected Then
    If Not TryUnprotectStageWorksheet(ws, usedPassword) Then Exit Sub
  End If
  ws.Range("A2:A251").ClearContents
  ws.Range("F2:F251").ClearContents

  rowOut = 2
  For cfgRow = 4 To 200
    fieldName = Trim$(CStr(cfg.Cells(cfgRow, "A").value))
    If fieldName = "" Then Exit For

    For regRow = 2 To 201
      If rowOut > 251 Then Exit For
      If IsNumeric(reg.Cells(regRow, "A").value) Then
        If StrComp(Trim$(CStr(reg.Cells(regRow, "D").value)), fieldName, vbTextCompare) = 0 Then
          bib = CLng(reg.Cells(regRow, "A").value)
          ws.Cells(rowOut, "A").value = bib
          ws.Cells(rowOut, "F").value = GetExistingStageTimeByBib(existingBib, existingTime, existingCount, bib)
          rowOut = rowOut + 1
        End If
      End If
    Next regRow
  Next cfgRow

SyncExit:
  If wasProtected Then
    ProtectStageWorksheet ws, usedPassword
  End If
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

  If Sh.Name = "Registration" Then
    Dim editedRegRange As Range
    Set editedRegRange = Intersect(Target, Sh.Range("A2:F201"))
    If editedRegRange Is Nothing Then Exit Sub

    If Target.CountLarge > 1 Then
      Application.EnableEvents = False
      RecalculateAllSheetsCore True
      GoTo SafeExit
    End If

    HandleRegistrationSheetChange Sh, Target
    Exit Sub
  End If

  If Not IsStageWorksheet(Sh) Then Exit Sub

  Dim editedStageRange As Range
  Set editedStageRange = Intersect(Target, Sh.Range("F2:F251"))
  If editedStageRange Is Nothing Then Exit Sub

  If Target.CountLarge > 1 Then
    Application.EnableEvents = False
    ClearDerivedOutputsForRange Sh, editedStageRange
    RecalculateStageAndGC Sh
    GoTo SafeExit
  End If

  Dim enteredBib As Variant, enteredField As String
  Dim normalized As Variant

  If Not NormalizeStageEntry(Target.value, normalized) Then
    MsgBox "Invalid time entry. Use hh:mm:ss, digits like 12345, or DNF/DNS.", vbExclamation, "Invalid Stage Entry"
    Application.EnableEvents = False
    Target.ClearContents
    Application.EnableEvents = True
    Exit Sub
  End If

  Application.EnableEvents = False
  Target.value = normalized
  If Not IsNumeric(Target.value) Then
    ClearDerivedOutputsForRange Sh, Target
  End If
  If IsNumeric(Target.value) Then Target.NumberFormat = GetWorkbookTimeNumberFormat()
  Application.EnableEvents = True

  enteredBib = Sh.Cells(Target.Row, "A").value
  enteredField = CStr(Sh.Cells(Target.Row, "B").value)
  If enteredBib = "" Then GoTo SafeExit

  Application.EnableEvents = False
  RecalculateStageAndGC Sh

  Dim foundBib As Range
  Set foundBib = Sh.Range("A2:A251").Find(What:=enteredBib, LookIn:=xlValues, LookAt:=xlWhole)

  Dim r As Long
  If Not foundBib Is Nothing And Application.Visible Then
    For r = foundBib.Row + 1 To 251
      If CStr(Sh.Cells(r, "B").value) = enteredField And CStr(Sh.Cells(r, "F").value) = "" Then
        Sh.Cells(r, "F").Select
        GoTo Reprotect
      End If
    Next r

    For r = 2 To 251
      If CStr(Sh.Cells(r, "B").value) = enteredField And CStr(Sh.Cells(r, "F").value) = "" Then
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
    ProtectStageWorksheet Sh, ""
    Sh.EnableSelection = xlUnlockedCells
  End If
  Application.EnableEvents = True
End Sub

Private Sub ClearDerivedOutputsForRange(ByVal ws As Worksheet, ByVal stageTimeRange As Range)
  On Error GoTo ClearExit

  If ws Is Nothing Then Exit Sub
  If stageTimeRange Is Nothing Then Exit Sub

  Dim c As Range
  For Each c In stageTimeRange.Cells
    If c.Row >= 2 And c.Row <= 251 Then
      Dim stageText As String
      stageText = UCase$(SafeText(c.value))
      If stageText = "" Or stageText = "DNF" Or stageText = "DNS" Or Not IsNumeric(c.value) Then
        ws.Cells(c.Row, "G").ClearContents
        ws.Cells(c.Row, "H").ClearContents
        ws.Cells(c.Row, "I").ClearContents
        ws.Cells(c.Row, "J").ClearContents
        ws.Cells(c.Row, "K").ClearContents
      End If
    End If
  Next c

ClearExit:
End Sub

Private Sub RecalculateStageAndGC(ByVal stageWs As Worksheet)
  On Error GoTo RecalcExit

  If stageWs Is Nothing Then Exit Sub

  EnsureStageDerivedFormulas stageWs

  ' Full dependency rebuild is expensive; regular calculation is sufficient here.
  Application.Calculate
  SortStageSheet stageWs
  EnforceStageDerivedClears stageWs
  SortGC

RecalcExit:
End Sub

Private Sub EnsureStageDerivedFormulas(ByVal ws As Worksheet)
  On Error GoTo FormulaExit

  If ws Is Nothing Then Exit Sub

  Dim bonusCol As String
  bonusCol = GetBonusConfigColumnForStageSheet(ws)
  If bonusCol = "" Then Exit Sub

  Dim bonusColIndex As Long
  bonusColIndex = ThisWorkbook.Worksheets("Config").Range(bonusCol & "1").Column

  With ws
    .Range("G2:G251").FormulaR1C1 = "=IF(OR(RC[-1]="""",UPPER(RC[-1])=""DNF"",UPPER(RC[-1])=""DNS""),"""",IF(ISNUMBER(RC[-1]),RC[-1]*86400,""""))"
    .Range("H2:H251").FormulaR1C1 = "=IF(OR(RC[-7]="""",RC[-6]="""",RC[-2]="""",UPPER(RC[-2])=""DNF"",UPPER(RC[-2])=""DNS""),"""",IF(ISNUMBER(RC[-1]),1+COUNTIFS(R2C2:R251C2,RC[-6],R2C7:R251C7,""<""&RC[-1]),""""))"
    .Range("I2:I251").FormulaR1C1 = "=IF(OR(RC[-1]="""",RC[-3]="""",UPPER(RC[-3])=""DNF"",UPPER(RC[-3])=""DNS""),"""",IFERROR(INDEX(Config!R4C" & CStr(bonusColIndex) & ":R6C" & CStr(bonusColIndex) & ",MATCH(RC[-1],Config!R4C8:R6C8,0)),0))"
    .Range("J2:J251").FormulaR1C1 = "=IF(RC[-3]="""","""",RC[-3]-RC[-1])"
    .Range("K2:K251").FormulaR1C1 = "=IF(RC[-1]="""","""",RC[-1]/86400)"
  End With

FormulaExit:
End Sub

Private Sub EnforceStageDerivedClears(ByVal ws As Worksheet)
  On Error GoTo ClearExit

  If ws Is Nothing Then Exit Sub

  Dim rowIndex As Long
  For rowIndex = 2 To 251
    Dim stageValue As Variant
    Dim stageText As String
    stageValue = ws.Cells(rowIndex, "F").value
    stageText = UCase$(SafeText(stageValue))

    If stageText = "" Or stageText = "DNF" Or stageText = "DNS" Or Not IsNumeric(stageValue) Then
      ws.Cells(rowIndex, "G").ClearContents
      ws.Cells(rowIndex, "H").ClearContents
      ws.Cells(rowIndex, "I").ClearContents
      ws.Cells(rowIndex, "J").ClearContents
      ws.Cells(rowIndex, "K").ClearContents
    End If
  Next rowIndex

ClearExit:
End Sub

Private Function GetBonusConfigColumnForStageSheet(ByVal ws As Worksheet) As String
  If ws Is Nothing Then
    GetBonusConfigColumnForStageSheet = ""
    Exit Function
  End If

  If HasTable(ws, "tblStage1") Then
    GetBonusConfigColumnForStageSheet = "I"
  ElseIf HasTable(ws, "tblStage2") Then
    GetBonusConfigColumnForStageSheet = "J"
  ElseIf HasTable(ws, "tblStage3") Then
    GetBonusConfigColumnForStageSheet = "K"
  Else
    GetBonusConfigColumnForStageSheet = ""
  End If
End Function

Private Sub HandleRegistrationSheetChange(ByVal ws As Worksheet, ByVal Target As Range)
  On Error GoTo RegExit

  If Target.Row < 2 Or Target.Row > 201 Then Exit Sub

  ' Navigation-only columns: B(2) C(3) E(5) F(6) ΓÇö just advance cursor, no other logic.
  ' Column D(4) is handled below by the field-assignment logic which also calls AdvanceRegCursor.
  Dim navCol As Long
  navCol = Target.Column
  If navCol = 2 Or navCol = 3 Or navCol = 5 Or navCol = 6 Then
    Application.EnableEvents = False
    AdvanceRegCursor ws, Target.Row, navCol
    Application.EnableEvents = True
    Exit Sub
  End If

  If Target.Column <> 1 And Target.Column <> 4 Then Exit Sub

  Dim fieldName As String
  Dim bibValue As Variant
  Dim recalcMode As Long
  ' recalcMode: 0 = none, 1 = lightweight registration refresh, 2 = full recalc
  fieldName = Trim$(CStr(ws.Cells(Target.Row, "D").value))

  Application.EnableEvents = False

  If Target.Column = 4 Then
    If fieldName = "" Then
      ws.Cells(Target.Row, "A").ClearContents
      recalcMode = 1
      GoTo RegExit
    End If

    bibValue = ws.Cells(Target.Row, "A").value
    If Trim$(CStr(bibValue)) = "" Then
      AssignNextBib ws, Target.Row, fieldName
      recalcMode = 1
      GoTo RegExit
    End If

    If Not IsBibValidForField(bibValue, fieldName, ws, Target.Row) Then
      ws.Cells(Target.Row, "A").ClearContents
      AssignNextBib ws, Target.Row, fieldName
    End If

    recalcMode = 1

    ' After Field is set (and bib assigned), move to Team (E).
    AdvanceRegCursor ws, Target.Row, 4
  ElseIf Target.Column = 1 Then
    bibValue = ws.Cells(Target.Row, "A").value

    If Trim$(CStr(bibValue)) = "" Then
      recalcMode = 2
      GoTo RegExit
    End If

    If fieldName = "" Then
      MsgBox "Select a Field before entering Bib.", vbExclamation, "Bib Validation"
      ws.Cells(Target.Row, "A").ClearContents
      recalcMode = 1
      GoTo RegExit
    End If

    If Not IsBibValidForField(bibValue, fieldName, ws, Target.Row) Then
      MsgBox "Bib must be unique and within the selected field's configured range.", vbExclamation, "Bib Validation"
      ws.Cells(Target.Row, "A").ClearContents
      recalcMode = 1
      GoTo RegExit
    End If

    ws.Cells(Target.Row, "A").value = CLng(CDbl(bibValue))
    recalcMode = 2
  End If

RegExit:
  If recalcMode = 1 Then
    RefreshRegistrationViewsFast
  ElseIf recalcMode = 2 Then
    RecalculateAllSheetsCore True
  End If
  Application.EnableEvents = True
End Sub

Private Sub RefreshRegistrationViewsFast()
  On Error GoTo FastExit

  Dim prevScreenUpdating As Boolean
  Dim prevCalculation As XlCalculation

  prevScreenUpdating = Application.ScreenUpdating
  prevCalculation = Application.Calculation

  Application.ScreenUpdating = False
  Application.Calculation = xlCalculationManual

  CompactRegistrationRows ThisWorkbook.Worksheets("Registration")
  SyncAllStageSheetsFromRegistration

FastExit:
  On Error Resume Next
  Application.Calculation = prevCalculation
  Application.ScreenUpdating = prevScreenUpdating
End Sub

Private Function FetchGoogleRidersCsv() As String
  On Error GoTo FetchFail

  Dim http As Object
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")

  Dim url As String
  url = "https://docs.google.com/spreadsheets/d/1TAKqNwmCDRKPEAKHFv0PrmCPiGly7bPacp7HqTw2id4/export?format=csv&gid=276157338"

  http.Open "GET", url, False
  http.setRequestHeader "Accept", "text/csv"
  http.send

  If http.Status < 200 Or http.Status >= 300 Then
    Err.Raise vbObjectError + 4101, "FetchGoogleRidersCsv", "Google export request failed (" & CStr(http.Status) & ")"
  End If

  FetchGoogleRidersCsv = CStr(http.responseText)
  Exit Function

FetchFail:
  Err.Raise Err.Number, "FetchGoogleRidersCsv", Err.Description
End Function

Private Function CsvFieldValue(ByVal values As Variant, ByVal index As Long) As String
  On Error GoTo FieldExit
  If IsArray(values) Then
    If index - 1 >= LBound(values) And index - 1 <= UBound(values) Then
      CsvFieldValue = Trim$(CStr(values(index - 1)))
      Exit Function
    End If
  End If

FieldExit:
  CsvFieldValue = ""
End Function

Private Function FindCsvHeaderIndex(ByVal headerValues As Variant, ByVal headerName As String) As Long
  Dim i As Long
  Dim normalizedHeader As String

  normalizedHeader = UCase$(Trim$(headerName))
  If normalizedHeader = "" Then Exit Function

  If IsArray(headerValues) Then
    For i = LBound(headerValues) To UBound(headerValues)
      If UCase$(Trim$(CStr(headerValues(i)))) = normalizedHeader Then
        FindCsvHeaderIndex = i + 1
        Exit Function
      End If
    Next i
  End If
End Function

Private Function BuildRegistrationKey(ByVal firstName As String, ByVal lastName As String, ByVal fieldName As String) As String
  BuildRegistrationKey = LCase$(Trim$(firstName) & "|" & Trim$(lastName) & "|" & Trim$(fieldName))
End Function

Private Function FindFirstBlankRegistrationRow(ByVal ws As Worksheet) As Long
  Dim rowIndex As Long
  For rowIndex = 2 To 201
    If IsRegistrationRowBlank(ws, rowIndex) Then
      FindFirstBlankRegistrationRow = rowIndex
      Exit Function
    End If
  Next rowIndex
End Function

Private Function IsRegistrationRowBlank(ByVal ws As Worksheet, ByVal rowIndex As Long) As Boolean
  Dim colIndex As Long
  For colIndex = 1 To 6
    If Trim$(CStr(ws.Cells(rowIndex, colIndex).Value)) <> "" Then Exit Function
  Next colIndex
  IsRegistrationRowBlank = True
End Function

Private Sub CompactRegistrationRows(ByVal ws As Worksheet)
  On Error GoTo CompactExit

  If ws Is Nothing Then Exit Sub

  Dim sourceRow As Long
  Dim destRow As Long
  Dim colIndex As Long
  Dim rowValues(1 To 6) As Variant

  destRow = 2
  For sourceRow = 2 To 201
    If Not IsRegistrationRowBlank(ws, sourceRow) Then
      If sourceRow <> destRow Then
        For colIndex = 1 To 6
          rowValues(colIndex) = ws.Cells(sourceRow, colIndex).Value
        Next colIndex

        For colIndex = 1 To 6
          ws.Cells(destRow, colIndex).Value = rowValues(colIndex)
        Next colIndex

        For colIndex = 1 To 6
          ws.Cells(sourceRow, colIndex).ClearContents
        Next colIndex
      End If

      destRow = destRow + 1
    End If
  Next sourceRow

CompactExit:
End Sub

Private Function MapGoogleAgeCategoryToField(ByVal ageCategory As String) As String
  Select Case UCase$(Trim$(ageCategory))
    Case "MEN 40-"
      MapGoogleAgeCategoryToField = "Men Under 40"
    Case "MEN 40+"
      MapGoogleAgeCategoryToField = "Men 40+"
    Case "MEN 50+", "MALE 50+"
      MapGoogleAgeCategoryToField = "Men 50+"
    Case "FEMALE"
      MapGoogleAgeCategoryToField = "Women"
    Case Else
      MapGoogleAgeCategoryToField = ""
  End Select
End Function

Private Function ParseCsvLineToArray(ByVal lineText As String) As Variant
  Dim values() As String
  Dim currentValue As String
  Dim charIndex As Long
  Dim currentChar As String
  Dim insideQuotes As Boolean
  Dim valueCount As Long

  ReDim values(0 To 0)
  currentValue = ""
  insideQuotes = False
  valueCount = 0

  For charIndex = 1 To Len(lineText)
    currentChar = Mid$(lineText, charIndex, 1)

    If currentChar = """" Then
      If insideQuotes And charIndex < Len(lineText) And Mid$(lineText, charIndex + 1, 1) = """" Then
        currentValue = currentValue & """"
        charIndex = charIndex + 1
      Else
        insideQuotes = Not insideQuotes
      End If
    ElseIf currentChar = "," And Not insideQuotes Then
      values(valueCount) = currentValue
      valueCount = valueCount + 1
      ReDim Preserve values(0 To valueCount)
      currentValue = ""
    Else
      currentValue = currentValue & currentChar
    End If
  Next charIndex

  values(valueCount) = currentValue
  ParseCsvLineToArray = values
End Function

Private Sub EnsureRegistrationSyncButton(ByVal ws As Worksheet)
  On Error GoTo BtnExit

  Dim btnName As String
  btnName = "btnSyncGoogleRiders"

  Dim usedPassword As String
  If ws.ProtectContents Then
    If Not TryUnprotectStageWorksheet(ws, usedPassword) Then Exit Sub
  End If
  On Error Resume Next
  ws.Shapes(btnName).Delete
  On Error GoTo BtnExit

  Dim btn As Shape
  Set btn = ws.Shapes.AddShape(msoShapeRoundedRectangle, GetActionButtonLeft(ws), ws.Rows(2).Top + 2, 130, 28)
  btn.Name = btnName
  btn.Placement = xlFreeFloating

  On Error Resume Next
  btn.TextFrame2.TextRange.Text = "Sync Google"
  btn.TextFrame2.TextRange.Font.Size = 11
  btn.TextFrame2.TextRange.Font.Bold = msoTrue
  btn.TextFrame2.VerticalAnchor = msoAnchorMiddle
  If Err.Number <> 0 Then
    Err.Clear
    btn.TextFrame.Characters.Text = "Sync Google"
    btn.TextFrame.HorizontalAlignment = xlHAlignCenter
    btn.TextFrame.VerticalAlignment = xlVAlignCenter
  End If
  On Error GoTo BtnExit

  btn.Fill.ForeColor.RGB = RGB(140, 82, 255)
  btn.Line.Visible = msoFalse

  On Error Resume Next
  btn.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
  On Error GoTo BtnExit
  btn.OnAction = "'" & ThisWorkbook.Name & "'!SyncGoogleRidersAction"

BtnExit:
  ProtectStageWorksheet ws, usedPassword
  ws.EnableSelection = xlUnlockedCells
End Sub

Private Sub EnsureRegistrationColumnHeader(ByVal ws As Worksheet)
  On Error GoTo HeaderExit

  Dim usedPassword As String
  If ws.ProtectContents Then
    If Not TryUnprotectStageWorksheet(ws, usedPassword) Then Exit Sub
  End If

  ws.Cells(1, "F").Value = "RegisteredDate"

HeaderExit:
  ProtectStageWorksheet ws, usedPassword
  ws.EnableSelection = xlUnlockedCells
End Sub

' Entry order per row: B(FirstName) -> C(LastName) -> D(Field) -> E(Team) -> F(RegisteredDate) -> B of next row
' Column A (Bib) auto-populates when Field (D) is set ΓÇö user never types it.
Private Sub AdvanceRegCursor(ByVal ws As Worksheet, ByVal rowNum As Long, ByVal col As Long)
  On Error Resume Next
  Dim nextCol As Long, nextRow As Long
  nextRow = rowNum
  Select Case col
    Case 2: nextCol = 3  ' FirstName -> LastName
    Case 3: nextCol = 4  ' LastName -> Field
    Case 4: nextCol = 5  ' Field -> Team
    Case 5: nextCol = 6  ' Team -> RegisteredDate
    Case 6              ' RegisteredDate -> FirstName of next row
      nextCol = 2
      nextRow = rowNum + 1
      If nextRow > 201 Then nextRow = rowNum
    Case Else: Exit Sub
  End Select
  If ws Is ActiveSheet Then ws.Cells(nextRow, nextCol).Select
End Sub

Private Sub AssignNextBib(ByVal ws As Worksheet, ByVal rowNum As Long, ByVal fieldName As String)
  Dim nextBib As Variant
  nextBib = GetNextAvailableBib(fieldName, ws, rowNum)

  If IsEmpty(nextBib) Then
    MsgBox "No available bib in the configured range for this field.", vbExclamation, "Bib Assignment"
    Exit Sub
  End If

  ws.Cells(rowNum, "A").value = CLng(nextBib)
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
    nameInCfg = Trim$(CStr(cfg.Cells(r, "C").value))
    If nameInCfg = "" Then Exit For

    If StrComp(nameInCfg, Trim$(fieldName), vbTextCompare) = 0 Then
      If IsNumeric(cfg.Cells(r, "D").value) And IsNumeric(cfg.Cells(r, "E").value) Then
        bibStart = CLng(cfg.Cells(r, "D").value)
        bibEnd = CLng(cfg.Cells(r, "E").value)
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
      If IsNumeric(ws.Cells(r, "A").value) Then
        If CLng(ws.Cells(r, "A").value) = bibNum Then
          IsBibDuplicate = True
          Exit Function
        End If
      End If
    End If
  Next r

  IsBibDuplicate = False
End Function

Private Function FindNextEmptyRegistrationRow(ByVal ws As Worksheet) As Long
  Dim rowIndex As Long
  For rowIndex = 2 To 201
    If Trim$(CStr(ws.Cells(rowIndex, "A").Value)) = "" And _
       Trim$(CStr(ws.Cells(rowIndex, "B").Value)) = "" And _
       Trim$(CStr(ws.Cells(rowIndex, "C").Value)) = "" And _
       Trim$(CStr(ws.Cells(rowIndex, "D").Value)) = "" And _
       Trim$(CStr(ws.Cells(rowIndex, "E").Value)) = "" And _
       Trim$(CStr(ws.Cells(rowIndex, "F").Value)) = "" Then
      FindNextEmptyRegistrationRow = rowIndex
      Exit Function
    End If
  Next rowIndex
End Function

Private Function FindRegistrationDuplicateRow(ByVal ws As Worksheet, ByVal firstName As String, ByVal lastName As String, ByVal fieldName As String) As Long
  Dim rowIndex As Long
  Dim candidateFirst As String, candidateLast As String, candidateField As String

  For rowIndex = 2 To 201
    candidateFirst = UCase$(Trim$(CStr(ws.Cells(rowIndex, "B").Value)))
    candidateLast = UCase$(Trim$(CStr(ws.Cells(rowIndex, "C").Value)))
    candidateField = UCase$(Trim$(CStr(ws.Cells(rowIndex, "D").Value)))

    If candidateFirst <> "" And candidateLast <> "" Then
      If candidateFirst = UCase$(Trim$(firstName)) And candidateLast = UCase$(Trim$(lastName)) And candidateField = UCase$(Trim$(fieldName)) Then
        FindRegistrationDuplicateRow = rowIndex
        Exit Function
      End If
    End If
  Next rowIndex
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

  Dim usedPassword As String
  If ws.ProtectContents Then
    If Not TryUnprotectStageWorksheet(ws, usedPassword) Then GoTo SortExit
  End If

  Dim itemCount As Long, rowIndex As Long, writeRow As Long
  Dim bibValues(1 To 200) As Variant
  Dim fieldOrders(1 To 200) As Long
  Dim statusOrders(1 To 200) As Long
  Dim totalSeconds(1 To 200) As Double

  For rowIndex = 2 To 201
    If IsNumeric(reg.Cells(rowIndex, "A").value) Then
      If Trim$(CStr(reg.Cells(rowIndex, "D").value)) <> "" Then
      itemCount = itemCount + 1
      bibValues(itemCount) = CLng(reg.Cells(rowIndex, "A").value)
      fieldOrders(itemCount) = GetGCFieldOrder(CStr(reg.Cells(rowIndex, "D").value))
      statusOrders(itemCount) = GetGCStatusOrder(GetBibGCStatus(CLng(reg.Cells(rowIndex, "A").value)))
      totalSeconds(itemCount) = GetBibTotalSeconds(CLng(reg.Cells(rowIndex, "A").value), statusOrders(itemCount))
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
  ws.Range("F1").value = "S1RawTime"
  ws.Range("G1").value = "S2RawTime"
  ws.Range("H1").value = "S3RawTime"

  For writeRow = 2 To 201
    Dim itemPos As Long
    itemPos = writeRow - 1
    If itemPos <= itemCount Then
      WriteGCRow ws, writeRow, bibValues(itemPos)
    End If
  Next writeRow

SortExit:
  ProtectStageWorksheet ws, usedPassword
  ws.Range("F2:H201").NumberFormat = "hh:mm:ss.00"
  ws.Range("J2:J201").NumberFormat = "\-hh:mm:ss.00"
  ws.Range("K2:K201").NumberFormat = "hh:mm:ss.00"
End Sub

Private Function GetBibGCStatus(ByVal bibNum As Long) As String
  Dim v1 As Variant, v2 As Variant, v3 As Variant

  v1 = GetStageValueByBib("tblStage1", bibNum, "F")
  v2 = GetStageValueByBib("tblStage2", bibNum, "F")
  v3 = GetStageValueByBib("tblStage3", bibNum, "F")

  If UCase$(SafeText(v1)) = "DNS" Or UCase$(SafeText(v2)) = "DNS" Or UCase$(SafeText(v3)) = "DNS" Then
    GetBibGCStatus = "DNS"
  ElseIf UCase$(SafeText(v1)) = "DNF" Or UCase$(SafeText(v2)) = "DNF" Or UCase$(SafeText(v3)) = "DNF" Then
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
    Dim bibRaw As Variant
    bibRaw = SafeCell(ws, r, "A")
    If IsNumeric(bibRaw) Then
      If CLng(CDbl(bibRaw)) = bibNum Then
        GetStageValueByBib = SafeCell(ws, r, colLetter)
        Exit Function
      End If
    End If
  Next r

  GetStageValueByBib = ""
End Function

Private Sub WriteGCRow(ByVal ws As Worksheet, ByVal rowNum As Long, ByVal bibValue As Variant)
  Dim q As String
  q = Chr$(34)

  ws.Cells(rowNum, "A").value = bibValue
  ws.Cells(rowNum, "B").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblReg[Field],MATCH(A" & rowNum & ",tblReg[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "C").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblReg[FirstName],MATCH(A" & rowNum & ",tblReg[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "D").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblReg[LastName],MATCH(A" & rowNum & ",tblReg[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "E").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblReg[Team],MATCH(A" & rowNum & ",tblReg[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "F").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblStage1[StageTime],MATCH(A" & rowNum & ",tblStage1[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "G").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblStage2[StageTime],MATCH(A" & rowNum & ",tblStage2[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "H").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IFERROR(INDEX(tblStage3[StageTime],MATCH(A" & rowNum & ",tblStage3[Bib],0))," & q & q & "))"
  ws.Cells(rowNum, "I").Formula = "=IF(COUNTA(F" & rowNum & ":H" & rowNum & ")=3,SUM(F" & rowNum & ":H" & rowNum & ")*86400-IF(J" & rowNum & "=" & q & q & ",0,J" & rowNum & "*86400)," & q & q & ")"
  ws.Cells(rowNum, "J").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IF(SUM(IFERROR(INDEX(tblStage1[BonusSeconds],MATCH(A" & rowNum & ",tblStage1[Bib],0)),0),IFERROR(INDEX(tblStage2[BonusSeconds],MATCH(A" & rowNum & ",tblStage2[Bib],0)),0),IFERROR(INDEX(tblStage3[BonusSeconds],MATCH(A" & rowNum & ",tblStage3[Bib],0)),0))=0," & q & q & ",SUM(IFERROR(INDEX(tblStage1[BonusSeconds],MATCH(A" & rowNum & ",tblStage1[Bib],0)),0),IFERROR(INDEX(tblStage2[BonusSeconds],MATCH(A" & rowNum & ",tblStage2[Bib],0)),0),IFERROR(INDEX(tblStage3[BonusSeconds],MATCH(A" & rowNum & ",tblStage3[Bib],0)),0))/86400))"
  ws.Cells(rowNum, "K").Formula = "=IF(I" & rowNum & "=" & q & q & "," & q & q & ",I" & rowNum & "/86400)"
  ws.Cells(rowNum, "L").value = GetBibGCStatus(CLng(bibValue))
  ws.Cells(rowNum, "M").Formula = "=IF(A" & rowNum & "=" & q & q & "," & q & q & ",IF(L" & rowNum & "=" & q & "Active" & q & ",1+COUNTIFS($B$2:$B$201,B" & rowNum & ",$L$2:$L$201," & q & "Active" & q & ",$K$2:$K$201," & q & "<" & q & "&K" & rowNum & "),IF(L" & rowNum & "=" & q & "Pending" & q & ",COUNTIFS($B$2:$B$201,B" & rowNum & ",$L$2:$L$201," & q & "Active" & q & ")+COUNTIFS($B$2:$B$201,B" & rowNum & ",$L$2:$L$201," & q & "Pending" & q & ",$A$2:$A$201," & q & "<" & q & "&A" & rowNum & ")+1," & q & q & ")))"
  ws.Cells(rowNum, "F").NumberFormat = "hh:mm:ss.00"
  ws.Cells(rowNum, "G").NumberFormat = "hh:mm:ss.00"
  ws.Cells(rowNum, "H").NumberFormat = "hh:mm:ss.00"
  ws.Cells(rowNum, "J").NumberFormat = "\-hh:mm:ss.00"
  ws.Cells(rowNum, "K").NumberFormat = "hh.mm.ss.00"
End Sub

Private Function GetGCFieldOrder(ByVal fieldValue As String) As Long
  Dim configSheet As Worksheet
  Dim configRow As Long
  Dim candidate As String

  Set configSheet = ThisWorkbook.Worksheets("Config")
  For configRow = 4 To 7
    candidate = CStr(configSheet.Cells(configRow, "A").value)
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
  If IsNumeric(cell.value) Then
    GetNumericCellValue = CDbl(cell.value)
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

  Dim usedPassword As String
  If ws.ProtectContents Then
    If Not TryUnprotectStageWorksheet(ws, usedPassword) Then Exit Sub
  End If
  On Error Resume Next
  ws.Shapes(btnName).Delete
  ws.Shapes(publishBtnName).Delete
  On Error GoTo BtnExit

  Dim btn As Shape
  Set btn = ws.Shapes.AddShape(msoShapeRoundedRectangle, GetActionButtonLeft(ws), ws.Rows(2).Top + 2, 130, 28)
  btn.Name = btnName
  btn.Placement = xlFreeFloating

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
    btn.Top = ws.Rows(3).Top + 2

    Set publishBtn = ws.Shapes.AddShape(msoShapeRoundedRectangle, GetActionButtonLeft(ws), ws.Rows(6).Top + 2, 120, 28)
    publishBtn.Name = publishBtnName
    publishBtn.Placement = xlFreeFloating
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
  ProtectStageWorksheet ws, usedPassword
  If IsStageWorksheet(ws) Then
    ws.EnableSelection = xlUnlockedCells
  End If
End Sub

Private Sub EnsureUpdateTimeButton(ByVal ws As Worksheet)
  On Error GoTo BtnExit

  Dim btnName As String
  btnName = "btnUpdateTime"

  Dim usedPassword As String
  If ws.ProtectContents Then
    If Not TryUnprotectStageWorksheet(ws, usedPassword) Then Exit Sub
  End If
  On Error Resume Next
  ws.Shapes(btnName).Delete
  On Error GoTo BtnExit

  Dim btn As Shape
  Set btn = ws.Shapes.AddShape(msoShapeRoundedRectangle, GetActionButtonLeft(ws), ws.Rows(5).Top + 2, 130, 28)
  btn.Name = btnName
  btn.Placement = xlFreeFloating

  On Error Resume Next
  btn.TextFrame2.TextRange.Text = "Update Time"
  btn.TextFrame2.TextRange.Font.Size = 11
  btn.TextFrame2.TextRange.Font.Bold = msoTrue
  btn.TextFrame2.VerticalAnchor = msoAnchorMiddle
  If Err.Number <> 0 Then
    Err.Clear
    btn.TextFrame.Characters.Text = "Update Time"
    btn.TextFrame.HorizontalAlignment = xlHAlignCenter
    btn.TextFrame.VerticalAlignment = xlVAlignCenter
  End If
  On Error GoTo BtnExit

  btn.Fill.ForeColor.RGB = RGB(20, 128, 98)
  btn.Line.Visible = msoFalse

  On Error Resume Next
  btn.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
  On Error GoTo BtnExit
  btn.OnAction = "'" & ThisWorkbook.Name & "'!UpdateTimeAction"

BtnExit:
  ProtectStageWorksheet ws, usedPassword
  ws.EnableSelection = xlUnlockedCells
End Sub

Private Function GetActionButtonLeft(ByVal ws As Worksheet) As Double
  Dim anchorColumn As Long
  anchorColumn = GetActionButtonColumn(ws)
  GetActionButtonLeft = ws.Cells(1, anchorColumn).Left
End Function

Private Function GetActionButtonColumn(ByVal ws As Worksheet) As Long
  Dim lastTableColumn As Long
  lastTableColumn = GetPrimaryTableLastColumn(ws)

  If lastTableColumn <= 0 Then
    GetActionButtonColumn = 14
  Else
    GetActionButtonColumn = lastTableColumn + 2
  End If
End Function

Private Function GetPrimaryTableLastColumn(ByVal ws As Worksheet) As Long
  On Error GoTo TableExit

  If ws Is Nothing Then Exit Function
  If ws.ListObjects.Count = 0 Then Exit Function

  GetPrimaryTableLastColumn = ws.ListObjects(1).Range.Column + ws.ListObjects(1).Range.Columns.Count - 1

TableExit:
End Function

Private Sub EnsureActionButtonViewport(ByVal ws As Worksheet)
  On Error GoTo ViewExit

  If ws Is Nothing Then Exit Sub
  If ActiveWindow Is Nothing Then Exit Sub
  If Not (ws.Name = "GC" Or IsStageWorksheet(ws) Or ws.Name = "Registration") Then Exit Sub

  ActiveWindow.FreezePanes = False
  ActiveWindow.SplitColumn = 0
  If ws.Name = "Registration" Then
    ActiveWindow.SplitRow = 1
  Else
    ActiveWindow.SplitRow = 6
  End If
  ActiveWindow.FreezePanes = True

ViewExit:
End Sub

Private Sub EnsureRegistrationViewport(ByVal ws As Worksheet)
  EnsureActionButtonViewport ws
End Sub

Public Sub PublishRaceResultsCore()
  On Error GoTo PublishFail

  Dim publishStep As String
  publishStep = "start"

  publishStep = "resolve_local_access_code"
  Dim accessCode As String
  accessCode = "35789"

  ' Ensure dependent formulas (net time/place/gc) are current before exporting.
  publishStep = "calculate_full"
  Application.CalculateFull

  publishStep = "build_payload"
  Dim payload As String
  payload = BuildPublishPayloadJson(accessCode)

  publishStep = "create_http"
  Dim http As Object
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")

  publishStep = "open_http"
  Dim endpoint As String
  endpoint = "https://www.nomadcyclingclub.com/api/race-admin/excelPublish"

  http.Open "POST", endpoint, False
  http.setRequestHeader "Content-Type", "application/json"
  publishStep = "send_http"
  http.send payload

  publishStep = "handle_response"
  If http.Status >= 200 And http.Status < 300 Then
    MsgBox "Race results published successfully to www.nomadcyclingclub.com/raceresults2026", vbInformation
  Else
    MsgBox "Publish failed (" & CStr(http.Status) & "): " & Left$(CStr(http.responseText), 500), vbCritical
  End If
  Exit Sub

PublishFail:
  MsgBox "Publish failed at step '" & publishStep & "' source='" & Err.Source & "' (" & CStr(Err.Number) & "): " & Err.Description, vbCritical
End Sub

Private Function BuildPublishPayloadJson(ByVal accessCode As String) As String
  On Error GoTo PayloadFail

  Dim payloadStep As String
  payloadStep = "init"

  Dim stage1 As Worksheet, stage2 As Worksheet, stage3 As Worksheet
  Set stage1 = GetStageWorksheetByTable("tblStage1")
  Set stage2 = GetStageWorksheetByTable("tblStage2")
  Set stage3 = GetStageWorksheetByTable("tblStage3")

  Dim gc As Worksheet
  Set gc = ThisWorkbook.Worksheets("GC")

  Dim eventName As String
  payloadStep = "event_name"
  eventName = "Nomad Stage Race 2026"
  On Error Resume Next
  If SafeText(ThisWorkbook.Worksheets("Config").Range("A1").value) <> "" Then
    eventName = SafeText(ThisWorkbook.Worksheets("Config").Range("A1").value)
  End If
  On Error GoTo 0

  payloadStep = "stage1_json"
  Dim stage1Json As String
  stage1Json = BuildStagePublishJson(stage1, "Group Stage", gc)

  payloadStep = "stage2_json"
  Dim stage2Json As String
  stage2Json = BuildStagePublishJson(stage2, "TT Stage", gc)

  payloadStep = "stage3_json"
  Dim stage3Json As String
  stage3Json = BuildStagePublishJson(stage3, "Mountain Stage", gc)

  payloadStep = "gc_json"
  Dim gcJson As String
  gcJson = BuildGCPublishJson(gc)

  Dim json As String
  payloadStep = "assemble_json"
  json = "{" & _
    """publisherEmail"":""" & JsonEscape("racepublisher@nomadcyclingclub.com") & """," & _
    """publishPassword"":""" & JsonEscape(accessCode) & """," & _
    """eventName"":""" & JsonEscape(eventName) & """," & _
    """publishedAt"":""" & JsonEscape(Format$(Now, "yyyy-mm-dd\THH:nn:ss")) & """," & _
    """stageTables"": [" & _
      stage1Json & "," & _
      stage2Json & "," & _
      stage3Json & _
    "]," & _
    """gc"": " & gcJson & _
  "}"

  BuildPublishPayloadJson = json
  Exit Function

PayloadFail:
  Err.Raise Err.Number, "BuildPublishPayloadJson:" & payloadStep, Err.Description
End Function

Private Function BuildStagePublishJson(ByVal ws As Worksheet, ByVal stageName As String, ByVal gcWs As Worksheet) As String
  On Error GoTo StageFail

  If ws Is Nothing Then
    BuildStagePublishJson = "{""stageName"":""" & JsonEscape(stageName) & """,""entries"":[]}"
    Exit Function
  End If

  Dim rowIndex As Long
  Dim chunks As String
  chunks = ""

  For rowIndex = 2 To 251
    On Error GoTo StageRowFail

    Dim stageBibRaw As Variant
    stageBibRaw = SafeCell(ws, rowIndex, "A")
    If Not IsNumeric(stageBibRaw) Or SafeText(stageBibRaw) = "" Then GoTo NextStageRow
    If CLng(CDbl(stageBibRaw)) = 0 Then GoTo NextStageRow

      Dim bibValue As Long
      bibValue = CLng(CDbl(stageBibRaw))

      Dim riderName As String
      riderName = Trim$(SafeText(SafeCell(ws, rowIndex, "C")) & " " & SafeText(SafeCell(ws, rowIndex, "D")))

      Dim teamName As String
      teamName = SafeText(SafeCell(ws, rowIndex, "E"))

      Dim fieldName As String
      fieldName = SafeText(SafeCell(ws, rowIndex, "B"))

      Dim statusText As String
      statusText = UCase$(SafeText(SafeCell(ws, rowIndex, "F")))

      Dim placePart As String
      placePart = "null"

      Dim stageRankRaw As Variant
      stageRankRaw = SafeCell(ws, rowIndex, "L")

      Dim elapsedPart As String
      elapsedPart = "null"

      Dim bonusPart As String
      bonusPart = "0"
      Dim bonusRaw As Variant: bonusRaw = SafeCell(ws, rowIndex, "I")
      If IsNumeric(bonusRaw) Then
        bonusPart = CStr(CLng(CDbl(bonusRaw)))
      End If

      Dim netRaw As Variant: netRaw = SafeCell(ws, rowIndex, "J")
      If statusText = "DNF" Or statusText = "DNS" Then
        ' DNF/DNS must never carry stale numeric values from formula lag.
        placePart = "null"
        elapsedPart = "null"
      ElseIf IsNumeric(netRaw) Then
        If IsNumeric(stageRankRaw) And CDbl(stageRankRaw) > 0 Then
          placePart = CStr(CLng(CDbl(stageRankRaw)))
        End If
        elapsedPart = CStr(CLng(CDbl(netRaw) * 1000#))
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

NextStageRow:
    On Error GoTo StageFail
  Next rowIndex

  BuildStagePublishJson = "{" & _
    """stageName"":""" & JsonEscape(stageName) & """," & _
    """entries"": [" & chunks & "]" & _
  "}"
  Exit Function

StageFail:
  Err.Raise Err.Number, "BuildStagePublishJson:" & stageName & ":row" & CStr(rowIndex), Err.Description

StageRowFail:
  Err.Clear
  Resume NextStageRow
End Function

Private Sub ResolveGcForBib(ByVal gcWs As Worksheet, ByVal bibValue As Long, ByRef gcRankPart As String, ByRef gcElapsedPart As String)
  gcRankPart = "null"
  gcElapsedPart = "null"

  If gcWs Is Nothing Then Exit Sub

  Dim rowIndex As Long
  For rowIndex = 2 To 201
    Dim bibRaw As Variant
    bibRaw = SafeCell(gcWs, rowIndex, "A")
    If IsNumeric(bibRaw) Then
      If CLng(CDbl(bibRaw)) = bibValue Then
        Dim rankRaw As Variant
        rankRaw = SafeCell(gcWs, rowIndex, "M")
        If IsNumeric(rankRaw) Then
          gcRankPart = CStr(CLng(CDbl(rankRaw)))
        End If

        Dim totalRaw As Variant
        totalRaw = SafeCell(gcWs, rowIndex, "I")
        If IsNumeric(totalRaw) Then
          gcElapsedPart = CStr(CLng(CDbl(totalRaw) * 1000#))
        End If
        Exit For
      End If
    End If
  Next rowIndex
End Sub
Private Function SafeCell(ByVal ws As Worksheet, ByVal rowIndex As Long, ByVal col As String) As Variant
  Dim v As Variant
  v = ws.Cells(rowIndex, col).value
  If IsError(v) Or IsNull(v) Or IsEmpty(v) Then
    SafeCell = ""
  Else
    SafeCell = v
  End If
End Function

Private Function SafeText(ByVal v As Variant) As String
  If IsError(v) Or IsNull(v) Or IsEmpty(v) Then
    SafeText = ""
  Else
    SafeText = Trim$(CStr(v))
  End If
End Function

Private Function BuildGCPublishJson(ByVal ws As Worksheet) As String
  On Error GoTo GCFail

  Dim rowIndex As Long
  Dim chunks As String
  chunks = ""

  For rowIndex = 2 To 201
    On Error GoTo GCRowFail

    Dim bibRaw As Variant
    bibRaw = SafeCell(ws, rowIndex, "A")
    If Not IsNumeric(bibRaw) Or SafeText(bibRaw) = "" Then GoTo NextGCRow

    Dim gcBib As Long
    gcBib = CLng(CDbl(bibRaw))

    Dim gcRiderName As String
    gcRiderName = Trim$(SafeText(SafeCell(ws, rowIndex, "C")) & " " & SafeText(SafeCell(ws, rowIndex, "D")))

    Dim gcTeam As String
    gcTeam = SafeText(SafeCell(ws, rowIndex, "E"))

    ' Count completed stages from F(S1NetTime) G(S2NetTime) H(S3NetTime)
    Dim stagesCompleted As Long
    stagesCompleted = 0
    Dim s1v As Variant: s1v = SafeCell(ws, rowIndex, "F")
    Dim s2v As Variant: s2v = SafeCell(ws, rowIndex, "G")
    Dim s3v As Variant: s3v = SafeCell(ws, rowIndex, "H")
    If IsNumeric(s1v) And CDbl(s1v) > 0 Then stagesCompleted = stagesCompleted + 1
    If IsNumeric(s2v) And CDbl(s2v) > 0 Then stagesCompleted = stagesCompleted + 1
    If IsNumeric(s3v) And CDbl(s3v) > 0 Then stagesCompleted = stagesCompleted + 1

    Dim gcStatus As String
    gcStatus = SafeText(SafeCell(ws, rowIndex, "L"))

    Dim gcRankValue As Long
    gcRankValue = 0
    Dim rankRaw As Variant: rankRaw = SafeCell(ws, rowIndex, "M")
    If IsNumeric(rankRaw) Then gcRankValue = CLng(CDbl(rankRaw))

    ' Column I = TotalSec (raw seconds), convert to ms
    Dim gcElapsedMs As Long
    gcElapsedMs = 0
    Dim totalSecRaw As Variant: totalSecRaw = SafeCell(ws, rowIndex, "I")
    If IsNumeric(totalSecRaw) And CDbl(totalSecRaw) > 0 Then
      gcElapsedMs = CLng(CDbl(totalSecRaw) * 1000#)
    End If

    Dim gcElapsedPart As String
    If gcElapsedMs > 0 Then gcElapsedPart = CStr(gcElapsedMs) Else gcElapsedPart = "null"

    Dim gcRankPart As String
    If gcRankValue > 0 Then gcRankPart = CStr(gcRankValue) Else gcRankPart = "null"

    If chunks <> "" Then chunks = chunks & ","
    chunks = chunks & "{" & _
      """rank"":" & gcRankPart & "," & _
      """bib"":" & CStr(gcBib) & "," & _
      """riderName"":""" & JsonEscape(gcRiderName) & """," & _
      """team"":""" & JsonEscape(gcTeam) & """," & _
      """gcStatus"":""" & JsonEscape(gcStatus) & """," & _
      """stagesCompleted"":" & CStr(stagesCompleted) & "," & _
      """elapsedMs"":" & gcElapsedPart & _
    "}"

NextGCRow:
    On Error GoTo GCFail
  Next rowIndex

  BuildGCPublishJson = "[" & chunks & "]"
  Exit Function

GCFail:
  Err.Raise Err.Number, "BuildGCPublishJson:row" & CStr(rowIndex), Err.Description

GCRowFail:
  Err.Clear
  Resume NextGCRow
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
  Dim usedPassword As String
  If ws.ProtectContents Then
    If Not TryUnprotectStageWorksheet(ws, usedPassword) Then Exit Sub
  End If

  For i = 2 To 251
    ws.Cells(i, "A").value = ""
  Next i

  For i = 2 To 201
    ws.Cells(i, "A").value = ThisWorkbook.Worksheets("Registration").Cells(i, "A").value
  Next i

InitExit:
  ProtectStageWorksheet ws, usedPassword
  ws.EnableSelection = xlUnlockedCells
End Sub

Private Function NormalizeStageEntry(ByVal rawValue As Variant, ByRef normalizedValue As Variant) As Boolean
  Dim textValue As String
  textValue = Trim$(CStr(rawValue))

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
    Dim numericValue As Double
    numericValue = CDbl(rawValue)

    If numericValue < 0# Then
      NormalizeStageEntry = False
      Exit Function
    End If

    If numericValue >= 0# And numericValue < 1# Then
      normalizedValue = numericValue
      NormalizeStageEntry = True
      Exit Function
    End If
  End If

  Dim parsedTimeValue As Double
  If TryParseTimeEntry(CStr(rawValue), parsedTimeValue) Then
    normalizedValue = parsedTimeValue
    NormalizeStageEntry = True
  Else
    NormalizeStageEntry = False
  End If
End Function

Private Function FindStageRowByBib(ByVal ws As Worksheet, ByVal bibValue As Long) As Long
  Dim r As Long
  For r = 2 To 251
    If IsNumeric(ws.Cells(r, "A").Value) Then
      If CLng(ws.Cells(r, "A").Value) = bibValue Then
        FindStageRowByBib = r
        Exit Function
      End If
    End If
  Next r
End Function

Private Function FindNextBlankStageTimeRow(ByVal ws As Worksheet, ByVal fieldName As String, ByVal currentRow As Long) As Long
  Dim r As Long

  For r = currentRow + 1 To 251
    If StrComp(CStr(ws.Cells(r, "B").Value), fieldName, vbTextCompare) = 0 Then
      If Trim$(CStr(ws.Cells(r, "F").Value)) = "" Then
        FindNextBlankStageTimeRow = r
        Exit Function
      End If
    End If
  Next r

  For r = 2 To currentRow - 1
    If StrComp(CStr(ws.Cells(r, "B").Value), fieldName, vbTextCompare) = 0 Then
      If Trim$(CStr(ws.Cells(r, "F").Value)) = "" Then
        FindNextBlankStageTimeRow = r
        Exit Function
      End If
    End If
  Next r
End Function

Private Function GetWorkbookTimeNumberFormat() As String
  GetWorkbookTimeNumberFormat = "hh:mm:ss.00"
End Function

Private Function TryParseTimeEntry(ByVal rawEntry As String, ByRef parsedValue As Double) As Boolean
  Dim cleanedEntry As String
  Dim parts() As String
  Dim hoursValue As Long, minutesValue As Long
  Dim secondsValue As Double
  Dim digitsOnly As String, i As Long, ch As String
  Dim hundredths As Long

  cleanedEntry = Trim$(rawEntry)
  If cleanedEntry = "" Then Exit Function

  If InStr(1, cleanedEntry, ":", vbBinaryCompare) > 0 Then
    parts = Split(cleanedEntry, ":")
    If UBound(parts) < 1 Or UBound(parts) > 2 Then Exit Function

    If Not IsNumeric(parts(0)) Or Not IsNumeric(parts(1)) Then Exit Function
    hoursValue = CLng(parts(0))
    minutesValue = CLng(parts(1))

    If UBound(parts) = 2 Then
      If Not IsNumeric(parts(2)) Then Exit Function
      secondsValue = CDbl(parts(2))
    Else
      secondsValue = 0#
    End If

    If minutesValue < 0 Or minutesValue >= 60 Then Exit Function
    If secondsValue < 0# Or secondsValue >= 60# Then Exit Function

    parsedValue = (CDbl(hoursValue) * 3600# + CDbl(minutesValue) * 60# + secondsValue) / 86400#
    TryParseTimeEntry = True
    Exit Function
  End If

  For i = 1 To Len(cleanedEntry)
    ch = Mid$(cleanedEntry, i, 1)
    If ch >= "0" And ch <= "9" Then digitsOnly = digitsOnly & ch
  Next i

  If digitsOnly = "" Then Exit Function

  hundredths = 0

  Select Case Len(digitsOnly)
    Case 1, 2
      hoursValue = 0
      minutesValue = 0
      secondsValue = CDbl(digitsOnly)

    Case 3
      hoursValue = 0
      minutesValue = CLng(Left$(digitsOnly, 1))
      secondsValue = CDbl(Right$(digitsOnly, 2))

    Case 4
      hoursValue = 0
      minutesValue = CLng(Left$(digitsOnly, 2))
      secondsValue = CDbl(Right$(digitsOnly, 2))

    Case 5
      hoursValue = CLng(Left$(digitsOnly, 1))
      minutesValue = CLng(Mid$(digitsOnly, 2, 2))
      secondsValue = CDbl(Right$(digitsOnly, 2))

    Case 6
      hoursValue = CLng(Left$(digitsOnly, 2))
      minutesValue = CLng(Mid$(digitsOnly, 3, 2))
      secondsValue = CDbl(Right$(digitsOnly, 2))

    Case 7
      hoursValue = CLng(Left$(digitsOnly, 1))
      minutesValue = CLng(Mid$(digitsOnly, 2, 2))
      secondsValue = CDbl(Mid$(digitsOnly, 4, 2))
      hundredths = CLng(Right$(digitsOnly, 2))

    Case 8
      hoursValue = CLng(Left$(digitsOnly, 2))
      minutesValue = CLng(Mid$(digitsOnly, 3, 2))
      secondsValue = CDbl(Mid$(digitsOnly, 5, 2))
      hundredths = CLng(Right$(digitsOnly, 2))

    Case Else
      Exit Function
  End Select

  If minutesValue < 0 Or minutesValue >= 60 Then Exit Function
  If secondsValue < 0# Or secondsValue >= 60# Then Exit Function

  parsedValue = (CDbl(hoursValue) * 3600# + CDbl(minutesValue) * 60# + secondsValue + (CDbl(hundredths) / 100#)) / 86400#
  TryParseTimeEntry = True
End Function

