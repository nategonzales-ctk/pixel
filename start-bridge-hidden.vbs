' Pixel Bridge — Silent Launcher
' Starts the Node.js bridge with no console window.
' Double-click to start now, or use add-to-startup.bat to auto-run on login.

Dim fso, shell, baseDir, bridgeDir

Set fso   = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

baseDir   = fso.GetParentFolderName(WScript.ScriptFullName)
bridgeDir = baseDir & "\bridge"

' Install / update dependencies silently
shell.Run "cmd /c cd /d """ & bridgeDir & """ && npm install --silent", 0, True

' Start the bridge from the bridge dir (so .env loads correctly), log to file
shell.Run "cmd /c cd /d """ & bridgeDir & """ && node server.js >> """ & bridgeDir & "\bridge.log"" 2>&1", 0, False
