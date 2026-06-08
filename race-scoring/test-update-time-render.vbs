Option Explicit

Dim workbookPath
workbookPath = "c:\Users\jabork\Documents\cycling-club-website\race-scoring\StageRace_3Day_TESTDATA_v11.xlsm"

Dim excel, wb, ws, bibValue, macroName
Set excel = CreateObject("Excel.Application")
excel.Visible = True
excel.DisplayAlerts = False
excel.EnableEvents = True
excel.AutomationSecurity = 1

Set wb = excel.Workbooks.Open(workbookPath)
Set ws = wb.Worksheets("Group Stage")
ws.Activate

bibValue = CLng(ws.Cells(2, "A").Value)
macroName = "'" & wb.Name & "'!UpdateTimeActionWithValues"

Dim beforeRaw, beforeText, beforeRow, afterRow
beforeRow = FindBibRow(ws, bibValue)
beforeRaw = ws.Cells(beforeRow, "F").Value2
beforeText = ws.Cells(beforeRow, "F").Text

' Deterministic test path: pass bib/time directly into the macro.
excel.Run macroName, CStr(bibValue), "12:34:56", "1"
WScript.Sleep 500

afterRow = FindBibRow(ws, bibValue)
WScript.Echo "Bib=" & CStr(bibValue) & " RowBefore=" & CStr(beforeRow) & " RowAfter=" & CStr(afterRow)
WScript.Echo "BeforeRaw=" & CStr(beforeRaw)
WScript.Echo "BeforeText=" & CStr(beforeText)
WScript.Echo "ValueRaw=" & CStr(ws.Cells(afterRow, "F").Value2)
WScript.Echo "ValueText=" & CStr(ws.Cells(afterRow, "F").Text)
WScript.Echo "NumberFormat=" & CStr(ws.Cells(afterRow, "F").NumberFormat)

wb.Close True
excel.Quit

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
