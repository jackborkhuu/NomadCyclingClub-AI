Attribute VB_Name = "ManualReorder"
Option Explicit

Public Sub ManualReorderStage()
  ThisWorkbook.ManualReorderStageCurrentSheetCore
End Sub

Public Sub ManualReorderGC()
  ThisWorkbook.ManualReorderGCCurrentSheetCore
End Sub

Public Sub UpdateTimeAction()
  ThisWorkbook.UpdateStageTimeCurrentSheetCore
End Sub

Public Sub UpdateTimeActionWithValues(ByVal bibValue As String, ByVal timeValue As String, Optional ByVal ttSequence As String = "1")
  ThisWorkbook.UpdateStageTimeCurrentSheetCore bibValue, timeValue, ttSequence
End Sub

Public Sub PublishRaceResultsAction()
  ThisWorkbook.PublishRaceResultsCore
End Sub
