# MOD Resources Sites

- <img src="app-image://seed-images/logo/logo-gamebanana.png" width="200" style="display:inline;vertical-align:middle;margin-right: 10px;" />[GameBanana](https://gamebanana.com)
- <img src="app-image://seed-images/logo/logo-arca.live.png" width="20" style="display:inline;vertical-align:middle;margin-right: 10px;" />[miHoYo Skin Mod Channel](https://arca.live/b/genshinskinmode?category=%EC%A7%88%EB%AC%B8%28%EB%AA%A8%EB%93%9C%EC%A0%9C%EC%9E%91%29)
- <img src="app-image://seed-images/logo/logo-Hei.png" width="20" style="display:inline;vertical-align:middle;margin-right: 10px;" />[Hui Site](https://huihui168.org)

---

## YuanShen.exe Genshin Impact 10612-4001 Error Code

<img src="app-image://seed-images/logo/error.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />

> Replace files in the GIMI directory of the XXMI tool + use a network disconnection strategy

1. [Reference - 원신 4001 all-in-one fix](https://arca.live/b/genshenskinmode/168042118?category=%EC%A7%88%EB%AC%B8%28%EB%AA%A8%EB%93%9C%EC%A0%9C%EC%9E%91%29&p=1)

2. [Reference https://gamebanana.com/search?\_sOrder=best_match&\_sSearchString=10612-4001](https://gamebanana.com/search?_sOrder=best_match&_sSearchString=10612-4001)

---

### Prerequisites

1. <u>3dmigoto-GIMI-for-playing-mods.zip</u> [Download](https://github.com/SilentNightSound/GI-Model-Importer/releases)
2. <u>XXMI-Launcher-Installer-Online-v2.2.1.msi</u> [Download](https://github.com/SpectrumQT/XXMI-Launcher/releases)
3. <u>genshin_bad_network.ps1</u> PowerShell script to automatically disconnect Genshin Impact from the network
4. <u>badwork.bat</u> Runs genshin_bad_network.ps1 as administrator

   [Use the above content directly](app-image://download)

---

### File Replacement

1. Extract `3dmigoto-GIMI-for-playing-mods.zip`, and install `XXMI-Launcher-Installer-Online-v2.2.1.msi`
2. Copy the extracted files from `3dmigoto-GIMI-for-playing-mods.zip` <img src="app-image://seed-images/logo/file-list.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />
   into the installed `XXMI\GIMI` directory, making sure to overwrite the original files in `XXMI\GIMI`

---

### Configuration Changes

1. Edit the `d3dx.ini` file in `XXMI\GIMI` <img src="app-image://seed-images/logo/d3dxini.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />
   Replace the path in the red-boxed `launch=` field with your own game path

2. Open `genshin_bad_network.ps1` with Notepad <img src="app-image://seed-images/logo/ps1.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />
   The red-boxed fields (`processName`, `programPath`) are what you need to modify.
   Set `$programPath` to your own game path. Ensure quotation marks `"` are not missing.
   The green-boxed value (`processName="value"`) must match the executable name at the end of the path (e.g., `...\\xxx.exe`).

3. If you have not moved `genshin_bad_network.ps1`, no changes are needed.
   If you have moved it, open `badwork.bat` <img src="app-image://seed-images/logo/badwork.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />
   and change `E:\bad_work.ps1` to the absolute path where your `genshin_bad_network.ps1` is located.

---

### Launching the Game

1. Launch the game by double-clicking `3DMigoto Loader.exe` inside `XXMI\GIMI`
2. Once you enter Teyvat, double-click `badwork.bat`. The game will lose network connection within 2–3 minutes.
   It is not recommended to play within the first 3 minutes after launch.
   After 3 minutes, continue monitoring.
   If no error occurs after 5 minutes of gameplay, congratulations—you succeeded!

##

---

## Auto F Script for Skipping Cutscenes

> Running the AutoHotkey script will automatically press F for you

- <u>AutoHotkey_2.0.26_setup.exe</u> [Download](https://www.autohotkey.com/)
- <u>fButton.ahk</u>
  [Open folder](app-image://download)

---

### Usage

1. Install `AutoHotkey_2.0.26_setup.exe`, then right-click `fButton.ahk` and run it as administrator
2. In-game, press `F8` at cutscene points where you want to skip (toggle on/off with F8).
   You can relax and watch videos while it handles the dialogue.
   Note: some cutscenes may enter infinite loops—avoid using it in those cases
