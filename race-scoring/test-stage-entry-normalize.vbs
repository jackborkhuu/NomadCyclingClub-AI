Option Explicit

Dim workbookPath
workbookPath = "c:\Users\jabork\Documents\cycling-club-website\race-scoring\StageRace_3Day_TESTDATA_v11.xlsm"

Dim excel, wb, ws, bibValue, beforeRow, afterRow
Set excel = CreateObject("Excel.Application")
excel.Visible = False
excel.DisplayAlerts = False
excel.EnableEvents = True
excel.AutomationSecurity = 1

Set wb = excel.Workbooks.Open(workbookPath)
Set ws = wb.Worksheets("Group Stage")
ws.Activate

bibValue = CLng(ws.Cells(2, "A").Value)
beforeRow = FindBibRow(ws, bibValue)

If Not TryUnprotect(ws) Then
  WScript.Echo "ERROR: unable to unprotect stage sheet"
  wb.Close False
  excel.Quit
  WScript.Quit 1
End If

ws.Cells(beforeRow, "F").Value = "123456"
WScript.Sleep 800

afterRow = FindBibRow(ws, bibValue)
WScript.Echo "Bib=" & CStr(bibValue) & " RowBefore=" & CStr(beforeRow) & " RowAfter=" & CStr(afterRow)
WScript.Echo "ValueRaw=" & CStr(ws.Cells(afterRow, "F").Value2)
WScript.Echo "ValueText=" & CStr(ws.Cells(afterRow, "F").Text)
WScript.Echo "NumberFormat=" & CStr(ws.Cells(afterRow, "F").NumberFormat)

wb.Close True
excel.Quit

Function TryUnprotect(ByVal stageWs)
  Dim pwds, i
  pwds = Array("2068514132", "race-lock", "")
  For i = 0 To UBound(pwds)
    On Error Resume Next
    Err.Clear
    stageWs.Unprotect CStr(pwds(i))
    If Err.Number = 0 And Not stageWs.ProtectContents Then
      TryUnprotect = True
      Exit Function
    End If
    On Error GoTo 0
  Next
  TryUnprotect = False
End Function

Function FindBibRow(ByVal stageWs, ByVal bib)
  Dim r
  For r = 2 To 251
    If IsNumeric(stageWs.Cells(r, "A").Value) Then
      If CLng(stageWs.Cells(r, "A").Value) = CLng(bib) Then
        FindBibRow = r
        Exit Function
      End If
    End If
  Next
  FindBibRow = 0
End Function
