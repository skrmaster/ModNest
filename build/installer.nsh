!macro customUnInstall
  System::Call 'kernel32::GetUserDefaultUILanguage() i .r0'
  IntCmp $0 2052 chinese english english
  chinese:
    StrCpy $1 "删除用户数据和配置？"
    Goto ask
  english:
    StrCpy $1 "Delete user data and configuration?"
  ask:
    MessageBox MB_YESNO "$1" IDNO done_customUnInstall
    RMDir /r "$APPDATA\Dimension-Workshop"
  done_customUnInstall:
!macroend
