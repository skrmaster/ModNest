#Requires AutoHotkey v2.0
#SingleInstance Force

global running := false

F8::
{
    global running

    running := !running

    if (running) {
        SetTimer(PressF, 1000)

        ToolTip("自动F:开启(Auto F: ON)")
        SetTimer(RemoveTip, -1000)
    }
    else {
        SetTimer(PressF, 0)

        ToolTip("自动F:关闭(Auto F: OFF)")
        SetTimer(RemoveTip, -1000)
    }
}

PressF() {
    SendInput("{f down}")
    Sleep(30)
    SendInput("{f up}")
}

RemoveTip() {
    ToolTip()
}
