; Custom NSIS script for YouTube Downloader Pro
; This script adds custom uninstaller prompts for user data handling

!macro customInit
  ; Custom initialization code for installer
  ; This runs before the installer UI is shown
!macroend

!macro customInstall
  ; Custom installation steps
  ; This runs during the installation process
  
  ; Create a flag file to indicate installation is complete
  FileOpen $0 "$INSTDIR\installed.flag" w
  FileWrite $0 "installed"
  FileClose $0
!macroend

!macro customUnInit
  ; Custom uninstaller initialization
  ; This runs when the uninstaller starts
!macroend

!macro customUnInstall
  ; Custom uninstallation steps with user data prompts
  
  ; Get the AppData path for this application
  StrCpy $0 "$APPDATA\yt-downloader"
  
  ; Check if user data directory exists
  ${If} ${FileExists} "$0\*.*"
    ; Show message box asking about downloads
    MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to keep your downloaded videos?$\n$\nYour downloads are located in:$\n$0\downloads$\n$\nClick 'Yes' to keep them, 'No' to delete them." IDYES keep_downloads
    
    ; User chose to delete downloads
    ${If} ${FileExists} "$0\downloads\*.*"
      RMDir /r "$0\downloads"
    ${EndIf}
    
    keep_downloads:
    
    ; Show message box asking about settings
    MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to keep your application settings?$\n$\nThis includes your preferences, download history, and configuration.$\n$\nClick 'Yes' to keep them, 'No' to delete them." IDYES keep_settings
    
    ; User chose to delete settings
    Delete "$0\settings.json"
    Delete "$0\window-state.json"
    Delete "$0\download-history.json"
    RMDir /r "$0\logs"
    RMDir /r "$0\cache"
    
    keep_settings:
    
    ; Try to remove the main directory (will only succeed if empty)
    RMDir "$0"
  ${EndIf}
  
  ; Remove desktop shortcut
  Delete "$DESKTOP\YouTube Downloader Pro.lnk"
  
  ; Remove start menu shortcuts
  RMDir /r "$SMPROGRAMS\YouTube Downloader Pro"
  
  ; Remove installation flag
  Delete "$INSTDIR\installed.flag"
  
  ; Clean up registry entries
  DeleteRegKey HKCU "Software\YouTube Downloader Pro"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}"
  
  ; Remove from Windows startup if present
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "YouTube Downloader Pro"
  
  ; Display completion message
  MessageBox MB_OK|MB_ICONINFORMATION "YouTube Downloader Pro has been uninstalled.$\n$\nThank you for using our application!"
!macroend

!macro customRemoveFiles
  ; Additional file cleanup
  ; This runs during the file removal phase
  
  ; Remove any temporary files
  Delete "$INSTDIR\*.tmp"
  Delete "$INSTDIR\*.log"
!macroend

!macro customHeader
  ; Custom header for installer/uninstaller
  !system "echo Custom NSIS script loaded"
!macroend
