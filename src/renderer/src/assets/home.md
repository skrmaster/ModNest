# MOD资源网站

- <img src="app-image://seed-images/logo/logo-gamebanana.png" width="200" style="display:inline;vertical-align:middle;margin-right: 10px;" />[GameBanana](https://gamebanana.com)
- <img src="app-image://seed-images/logo/logo-arca.live.png" width="20" style="display:inline;vertical-align:middle;margin-right: 10px;" />[미호요스킨모드 채널](<https://arca.live/b/genshinskinmode?category=%EC%A7%88%EB%AC%B8(%EB%AA%A8%EB%93%9C%EC%A0%9C%EC%9E%91)>)
- <img src="app-image://seed-images/logo/logo-Hei.png" width="20" style="display:inline;vertical-align:middle;margin-right: 10px;" />[Hui站](https://huihui168.org)

## YuanShen.exe 原神10612-4001错误码

<img src="app-image://seed-images/logo/error.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />

> 替换XXMI工具中的GIMI目录中的文件+断网策略实现

1. [参考-원신 4001 올인원 해결법](https://arca.live/b/genshinskinmode/168042118?category=%EC%A7%88%EB%AC%B8%28%EB%AA%A8%EB%93%9C%EC%A0%9C%EC%9E%91%29&p=1)

2. [参考https://gamebanana.com/search?\_sOrder=best_match&\_sSearchString=10612-4001](https://gamebanana.com/search?_sOrder=best_match&_sSearchString=10612-4001)

#### 前置内容

1. <u>3dmigoto-GIMI-for-playing-mods.zip</u> [自行下载](https://github.com/SilentNightSound/GI-Model-Importer/releases)
2. <u>XXMI-Launcher-Installer-Online-v2.2.1.msi</u> [自行下载](https://github.com/SpectrumQT/XXMI-Launcher/releases)
3. <u>genshin_bad_network.ps1</u> 自动断开原神网络powershell脚本
4. <u>badwork.bat</u> 以管理员方式运行genshin_bad_network.ps1

   [直接使用上述内容](app-image://download)

#### 替换文件

1. 解压3dmigoto-GIMI-for-playing-mods.zip, 安装XXMI-Launcher-Installer-Online-v2.2.1.msi
2. 把解压好的3dmigoto-GIMI-for-playing-mods.zip下的文件<img src="app-image://seed-images/logo/file-list.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />复制到安装的XXMI`XXMI\GIMI`目录下，注意是覆盖替换掉`XXMI\GIMI`目录中原有的文件

#### 修改配置

1. 修改`XXMI\GIMI`下的`d3dx.ini`文件<img src="app-image://seed-images/logo/d3dxini.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />把红框(launch=)中的路径换成自己的游戏路径
2. 用记事本打开`genshin_bad_network.ps1`<img src="app-image://seed-images/logo/ps1.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />，其中红框(processName,programPath)是要修改的内容，`$programPath`改为自己的游戏路径，需要注意`"`是否缺失，绿框(processName="`值`"，`值`是否等于programPath中X:xxx\\xxx\\xxx\\`值`.exe)是确保内容一致
3. 若没有移动`genshin_bad_network.ps1`则不用修改。若移动过则用记事本打开`badwork.bat`<img src="app-image://seed-images/logo/badwork.png" width="100" style="display:inline;vertical-align:middle;margin-right: 10px;" />，将`E:\bad_work.ps1`改为自己`genshin_bad_network.ps1`所在的绝对路径

#### 启动游戏

1. 通过`XXMI\GIMI`中的`3DMigoto Loader.exe`双击启动游戏
2. 一旦进入提瓦特大陆就双击运行`badwork.bat`, 游戏会在2min~3min中断网，不建议在游戏启动后前3min内游玩，3min过后还需要检测，只要游戏时间过5分钟没出现错误，恭喜你成功了！！！

##

---

## 自动F，用于跳过剧情

> 运行autokey脚本会帮你自动按F

- <u>AutoHotkey_2.0.26_setup.exe</u> [自行下载](https://www.autohotkey.com/)
- <u>fButton.ahk</u>
  [打开目录](app-image://download)

#### 使用方式

1. 安装AutoHotkey_2.0.26_setup.exe，右键fButton.ahk文件，以管理员方式运行
2. 进入游戏，在需要跳过的剧情处按`F8`(F8开启和F8关闭)，解放双手，刷会儿视频剧情也完了。不过需要注意由于某些剧情可能出现死循环，避开循环线再使用
