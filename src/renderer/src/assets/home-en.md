# MOD Resources Websites

- <img src="app-image://seed-images/logo/logo-gamebanana.png" width="200" style="display:inline;vertical-align:middle;margin-right: 10px;" />[GameBanana](https://gamebanana.com)
- <img src="app-image://seed-images/logo/logo-arca.live.png" width="20" style="display:inline;vertical-align:middle;margin-right: 10px;" />[Mihoyo Skin Mod Channel](https://arca.live/b/genshinskinmode?category=%EC%A7%88%EB%AC%B8%28%EB%AA%A8%EB%93%9C%EC%A0%9C%EC%9E%91%29)
- <img src="app-image://seed-images/logo/logo-Hei.png" width="20" style="display:inline;vertical-align:middle;margin-right: 10px;" />[Hui Site](https://huihui168.org)

---

## YuanShen.exe Genshin 10612-4001 Error Code

<img src="app-image://seed-images/logo/error.png" width="100" class="mb-4" style="display:inline;vertical-align:middle;margin-right: 10px;" />

> Replace files in the GIMI directory inside the XXMI tool + use a network disconnection strategy to resolve the issue

1. [Reference - 원신 4001 all-in-one fix](https://arca.live/b/genshinskinmode/168042118?category=%EC%A7%88%EB%AC%B8%28%EB%AA%A8%EB%93%9C%EC%A0%9C%EC%9E%91%29&p=1)

2. [Reference https://gamebanana.com/search?\_sOrder=best_match&\_sSearchString=10612-4001](https://gamebanana.com/search?_sOrder=best_match&_sSearchString=10612-4001)

---

For now, do **not focus on the prerequisites, file replacement, configuration changes, or launching steps**. Only check them if the game fails to start after clicking “Start Game”.

<span class="text-red-600">!!!Attention: Please start XXMI first!!!</span>
If XXMI is not installed, please install it first [`Install`](app-image://open-XXMI.msi) [`Official Website`](https://github.com/SpectrumQT/XXMI-Launcher/releases)

<a href="app-action://start-genshin" style="background:#f0c14b;color:#333;border;border-radius:6px;padding:12px 30px;font-size:20px;font-weight:700;cursor;box-shadow:0 2px 8px rgba(0,0,0,.25);display:inline-block;margin-inline: auto;">🎮 Start Game</a> Wait for the game to launch successfully. When loading reaches the screen shown below:

<img src="app-image://seed-images/logo/genshin-loading.png" width="180" style="display:inline;vertical-align:middle;margin-right: 10px;border: 1px solid #eee" />

Then click [`Start Network Disconnection`](app-action://internet_outage)

> The game will disconnect from the network after about 2–3 minutes. It is not recommended to play within the first 3 minutes after launch. After 3 minutes, additional checks may still occur. If you can pass 5 minutes of gameplay without errors, congratulations — it worked!!!
> It is recommended to avoid online matchmaking when using mods, as it can easily cause problems.

> Also: you must already have mods placed in XXMI/GIMI/Mods to see any effect.

---

## Prerequisites

1. <u>3dmigoto-GIMI-for-playing-mods.zip</u> [Download yourself](https://github.com/SilentNightSound/GI-Model-Importer/releases)
2. <u>XXMI-Launcher-Installer-Online-v2.2.1.msi</u> [Download yourself](https://github.com/SpectrumQT/XXMI-Launcher/releases)
3. <u>genshin_bad_network.ps1</u> PowerShell script for automatically disconnecting Genshin Impact network
4. <u>badwork.bat</u> Run genshin_bad_network.ps1 as administrator

   [Use the above files directly](app-image://download)

---

## File Replacement

1. Extract `3dmigoto-GIMI-for-playing-mods.zip` and install `XXMI-Launcher-Installer-Online-v2.2.1.msi`
2. Copy the extracted files from `3dmigoto-GIMI-for-playing-mods.zip` <img src="app-image://seed-images/logo/file-list.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />
   into the installed `XXMI\GIMI` directory, overwriting the original files in `XXMI\GIMI`

---

## Configuration Changes

1. Edit the `d3dx.ini` file inside `XXMI\GIMI` <img src="app-image://seed-images/logo/d3dxini.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />
   Replace the path in the red box (`launch=`) with your own game path.

2. [Apply directly](action://updatePs1) If successful, you can ignore step 2 below:
   (Open `genshin_bad_network.ps1` with Notepad <img src="app-image://seed-images/logo/ps1.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />
   The red-boxed fields (`processName`, `programPath`) must be edited.
   Set `$programPath` to your own game path. Be careful not to remove quotes `"`
   Ensure `processName="value"` matches the `.exe` name at the end of the path `X:\...\...\...\value.exe`)

3. If you did not move `genshin_bad_network.ps1`, no changes are needed.
   If you did move it, open `badwork.bat` with Notepad <img src="app-image://seed-images/logo/badwork.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />
   and change `E:\bad_work.ps1` to the absolute path of your `genshin_bad_network.ps1`

---

## Launch Game

1. Launch the game by double-clicking `3DMigoto Loader.exe` inside `XXMI\GIMI`
2. Once you enter Teyvat, run `badwork.bat` immediately. The game will disconnect from the network after 2–3 minutes. Do not play within the first 3 minutes. After that, further checks may still occur. If you pass 5 minutes without errors, congratulations — it worked!!!

---

## Auto F (Auto-Press F for Skipping Dialogues)

> Running the AutoHotkey script will automatically press F for you.

- <u>AutoHotkey_2.0.26_setup.exe</u> [Download yourself](https://www.autohotkey.com/)
- <u>fButton.ahk</u>
  [Open folder](app-image://download)

---

### How to Use

1. Install AutoHotkey_2.0.26_setup.exe, then right-click `fButton.ahk` and run it as administrator
2. Enter the game. When you reach cutscenes you want to skip, press `F8` (toggle on/off).
   This frees your hands so you can watch videos while the dialogue progresses.
   Note: some cutscenes may enter a **loop**, so avoid using it in those cases.
