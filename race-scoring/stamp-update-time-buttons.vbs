Option Explicit

Dim files
files = Array( _
  "c:\Users\jabork\Documents\cycling-club-website\race-scoring\StageRace_3Day_TESTDATA_v11.xlsm", _
  "c:\Users\jabork\Documents\cycling-club-website\race-scoring\StageRace_3Day_TESTDATA_v11_open.xlsm" _
)

Dim excel
Set excel = CreateObject("Excel.Application")
excel.Visible = False
excel.DisplayAlerts = False
excel.EnableEvents = False

Dim i, wb, ws, names, s, btn
names = Array("Group Stage", "TT Stage", "Mountain Stage")

On Error Resume Next
For i = 0 To UBound(files)
  Set wb = excel.Workbooks.Open(files(i))
  If Err.Number <> 0 Then
    WScript.Echo "ERROR open " & files(i) & " -> " & Err.Number & " " & Err.Description
    Err.Clear
  Else
    For Each s In names
      Set ws = wb.Worksheets(CStr(s))
      If Err.Number = 0 Then
        ws.Unprotect "2068514132"
        If Err.Number <> 0 Then
          WScript.Echo "WARN unprotect " & CStr(s) & " -> " & Err.Number & " " & Err.Description
          Err.Clear
        End If
        ws.Shapes("btnUpdateTime").Delete
        Err.Clear
        Set btn = ws.Shapes.AddShape(1, ws.Range("N5").Left, ws.Range("N5").Top, 160, 30)
        If Err.Number <> 0 Then
          WScript.Echo "ERROR AddShape " & CStr(s) & " -> " & Err.Number & " " & Err.Description
          Err.Clear
        Else
        btn.Name = "btnUpdateTime"
        btn.TextFrame2.TextRange.Text = "Update Time"
        btn.TextFrame2.TextRange.Font.Size = 11
        btn.TextFrame2.TextRange.Font.Bold = True
        btn.Fill.ForeColor.RGB = RGB(20, 128, 98)
        btn.Line.Visible = 0
        btn.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = RGB(255, 255, 255)
        btn.OnAction = "'" & wb.Name & "'!UpdateTimeAction"
        End If
        ws.Protect "2068514132", True, True, True, True, True
        If Err.Number <> 0 Then
          WScript.Echo "WARN protect " & CStr(s) & " -> " & Err.Number & " " & Err.Description
          Err.Clear
        End If
      Else
        WScript.Echo "ERROR missing sheet " & CStr(s) & " -> " & Err.Number & " " & Err.Description
        Err.Clear
      End If
    Next
    wb.Save
    If Err.Number <> 0 Then
      WScript.Echo "ERROR save " & files(i) & " -> " & Err.Number & " " & Err.Description
      Err.Clear
    End If
    wb.Close False
    WScript.Echo "Stamped: " & files(i)
  End If
Next

excel.Quit
