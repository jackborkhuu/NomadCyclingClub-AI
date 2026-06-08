Option Explicit

Dim basePath
basePath = "c:\Users\jabork\Documents\cycling-club-website\race-scoring"

Dim twFile, mrFile
twFile = basePath & "\ThisWorkbook_AutoSort.bas"
mrFile = basePath & "\ManualReorder.bas"

Dim files
files = Array( _
  basePath & "\StageRace_3Day_TESTDATA_v11.xlsm", _
  basePath & "\StageRace_3Day_TESTDATA_v11_open.xlsm" _
)

Dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
If Not fso.FileExists(twFile) Then
  WScript.Echo "ERROR: missing " & twFile
  WScript.Quit 1
End If
If Not fso.FileExists(mrFile) Then
  WScript.Echo "ERROR: missing " & mrFile
  WScript.Quit 1
End If

Dim twContent, twCodeStart
twContent = ReadAllText(twFile)
twCodeStart = InStr(1, twContent, "Option Explicit", vbTextCompare)
If twCodeStart = 0 Then
  WScript.Echo "ERROR: Option Explicit not found in ThisWorkbook export."
  WScript.Quit 1
End If
Dim twCode
twCode = Mid(twContent, twCodeStart)

Dim excel
Set excel = CreateObject("Excel.Application")
excel.Visible = False
excel.DisplayAlerts = False
excel.EnableEvents = False
excel.AutomationSecurity = 3

Dim i
For i = 0 To UBound(files)
  InjectWorkbook excel, files(i), twCode, mrFile
Next

excel.Quit
WScript.Echo "Injection complete."

Sub InjectWorkbook(ByVal excelApp, ByVal wbPath, ByVal codeText, ByVal mrBasPath)
  On Error Resume Next

  If Not fso.FileExists(wbPath) Then
    WScript.Echo "ERROR: workbook missing " & wbPath
    Exit Sub
  End If

  Dim wb
  Set wb = excelApp.Workbooks.Open(wbPath)
  If Err.Number <> 0 Then
    WScript.Echo "ERROR open " & wbPath & " -> " & Err.Number & " " & Err.Description
    Err.Clear
    Exit Sub
  End If

  Dim vbProj, twCodeModule
  Set vbProj = wb.VBProject
  If Err.Number <> 0 Then
    WScript.Echo "ERROR VBProject access " & wbPath & " -> " & Err.Number & " " & Err.Description
    Err.Clear
    wb.Close False
    Exit Sub
  End If

  Set twCodeModule = vbProj.VBComponents("ThisWorkbook").CodeModule
  If Err.Number <> 0 Then
    WScript.Echo "ERROR ThisWorkbook module " & wbPath & " -> " & Err.Number & " " & Err.Description
    Err.Clear
    wb.Close False
    Exit Sub
  End If

  If twCodeModule.CountOfLines > 0 Then
    twCodeModule.DeleteLines 1, twCodeModule.CountOfLines
    If Err.Number <> 0 Then
      WScript.Echo "ERROR deleting ThisWorkbook lines " & wbPath & " -> " & Err.Number & " " & Err.Description
      Err.Clear
      wb.Close False
      Exit Sub
    End If
  End If

  twCodeModule.AddFromString codeText
  If Err.Number <> 0 Then
    WScript.Echo "ERROR adding ThisWorkbook code " & wbPath & " -> " & Err.Number & " " & Err.Description
    Err.Clear
    wb.Close False
    Exit Sub
  End If

  Dim oldComp
  Set oldComp = Nothing
  Set oldComp = vbProj.VBComponents("ManualReorder")
  If Err.Number = 0 Then
    vbProj.VBComponents.Remove oldComp
    If Err.Number <> 0 Then
      WScript.Echo "ERROR removing ManualReorder " & wbPath & " -> " & Err.Number & " " & Err.Description
      Err.Clear
      wb.Close False
      Exit Sub
    End If
  Else
    Err.Clear
  End If

  vbProj.VBComponents.Import mrBasPath
  If Err.Number <> 0 Then
    WScript.Echo "ERROR importing ManualReorder " & wbPath & " -> " & Err.Number & " " & Err.Description
    Err.Clear
    wb.Close False
    Exit Sub
  End If

  wb.Save
  If Err.Number <> 0 Then
    WScript.Echo "ERROR saving " & wbPath & " -> " & Err.Number & " " & Err.Description
    Err.Clear
    wb.Close False
    Exit Sub
  End If

  wb.Close False
  WScript.Echo "Injected: " & wbPath
End Sub

Function ReadAllText(ByVal p)
  Dim ts
  Set ts = fso.OpenTextFile(p, 1, False)
  ReadAllText = ts.ReadAll
  ts.Close
End Function
