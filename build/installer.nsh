!macro customUnInstall

  System::Call 'kernel32::GetUserDefaultUILanguage() i .r0'
  IntCmp $0 2052 lang_cn lang_en lang_en

lang_cn:
  StrCpy $0 "删除用户数据和配置？"
  StrCpy $1 "无法删除用户配置，文件可能正在占用！$\n路径：$APPDATA\Dimension-Workshop"
  Goto ask

lang_en:
  StrCpy $0 "Delete user data and configuration?"
  StrCpy $1 "Failed to delete config, files may be in use!$\nPath: $APPDATA\Dimension-Workshop"

ask:
  MessageBox MB_YESNO|MB_ICONQUESTION "$0" IDNO done_customUnInstall

  RMDir /r "$APPDATA\Dimension-Workshop"

  IfFileExists "$APPDATA\Dimension-Workshop\*.*" del_fail done_customUnInstall

del_fail:
  MessageBox MB_OK|MB_ICONEXCLAMATION "$1"

done_customUnInstall:
!macroend
