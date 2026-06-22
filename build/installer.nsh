LangString DELETE_DATA ${LANG_SIMPCHINESE} "删除用户数据和配置？"
LangString DELETE_DATA ${LANG_ENGLISH} "Delete user data and configuration?"

!macro customUnInstall

MessageBox MB_YESNO "$(DELETE_DATA)" IDNO done

RMDir /r "$APPDATA\Dimension-Workshop"

done:

!macroend
