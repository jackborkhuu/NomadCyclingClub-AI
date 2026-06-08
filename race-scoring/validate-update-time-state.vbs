Option Explicit

Dim targetPath
If WScript.Arguments.Count > 0 Then
  targetPath = CStr(WScript.Arguments(0))
Else
  targetPath = "c:\Users\jabork\Documents\cycling-club-website\race-scoring\StageRace_3Day_TESTDATA_v11.xlsm"
End If

Dim excel, wb, ws, s, shapeObj, names
Set excel = CreateObject("Excel.Application")
excel.Visible = False
excel.DisplayAlerts = False
excel.EnableEvents = False

Set wb = excel.Workbooks.Open(targetPath)
If Err.Number <> 0 Then
  WScript.Echo "ERROR open workbook: " & Err.Number & " " & Err.Description
  excel.Quit
  WScript.Quit 1
End If
Err.Clear
On Error Resume Next

' Verify macro exists in ThisWorkbook module
Dim cm, lineCount, i, lineText, hasProc
hasProc = False
Set cm = wb.VBProject.VBComponents("ThisWorkbook").CodeModule
lineCount = cm.CountOfLines
For i = 1 To lineCount
  lineText = cm.Lines(i, 1)
    If InStr(1, lineText, "Public Sub UpdateStageTimeCurrentSheetCore", vbTextCompare) > 0 Then
    hasProc = True
    Exit For
  End If
Next
WScript.Echo "MacroExists ThisWorkbook.UpdateStageTimeCurrentSheetCore=" & CStr(hasProc)

Dim helperHasProc, cmHelper
helperHasProc = False
Set cmHelper = wb.VBProject.VBComponents("ManualReorder").CodeModule
If Err.Number = 0 Then
  For i = 1 To cmHelper.CountOfLines
    lineText = cmHelper.Lines(i, 1)
    If InStr(1, lineText, "Public Sub UpdateTimeAction()", vbTextCompare) > 0 Then
      helperHasProc = True
      Exit For
    End If
  Next
Else
  Err.Clear
End If
WScript.Echo "MacroExists ManualReorder.UpdateTimeAction=" & CStr(helperHasProc)

names = Array("Group Stage", "TT Stage", "Mountain Stage")
For Each s In names
  Set ws = wb.Worksheets(CStr(s))
  If Err.Number <> 0 Then
    WScript.Echo CStr(s) & " | ERROR missing sheet"
    Err.Clear
  Else
    Set shapeObj = Nothing
    Set shapeObj = ws.Shapes("btnUpdateTime")
    If Err.Number <> 0 Or shapeObj Is Nothing Then
      WScript.Echo CStr(s) & " | btnUpdateTime=False"
      Err.Clear
    Else
      WScript.Echo CStr(s) & " | btnUpdateTime=True | OnAction=" & CStr(shapeObj.OnAction)
    End If
  End If
Next

wb.Close False
excel.Quit
