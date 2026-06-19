!macro customUnInstall

MessageBox MB_YESNO \
"删除用户数据和配置？" \
IDNO done

RMDir /r "$APPDATA\MyApp"

done:

!macroend
