---
title: Meltdown&Specture漏洞完全修复教程
tags:
  - Meltdown
  - patch
  - spercture
  - 补丁
categories:
  - 计算机安全
date: 2018-01-18 12:36:22
gitmentId: /meltdown-and-specture-repair/
aliases: 
  - /meltdown-and-specture-repair
toc: true
draft: false
description: 修复多平台下Meltdown/Specture漏洞
---

概述
==

2018年1月4日，Jann Horn等安全研究者披露了"Meltdown"(CVE-2017-5754)和"Spectre"(CVE-2017-5753 & CVE-2017-5715)两组CPU特性漏洞。 据悉，漏洞会造成CPU运作机制上的信息泄露，低权级的攻击者可以通过漏洞来远程泄露（浏览器形式）用户信息或本地泄露更高权级的内存信息。

*   实际攻击场景中，攻击者在一定条件下可以做到，
*   泄露出本地操作系统底层运作信息，秘钥信息等；
*   通过获取泄露的信息，可以绕过内核(Kernel), 虚拟机超级管理器(HyperVisor)的隔离防护；
*   云服务中，可以泄露到其它租户隐私信息；
*   通过浏览器泄露受害者的帐号，密码，内容，邮箱, cookie等用户隐私信息；

目前相关的平台，厂商，软件提供商都在积极应对该系列漏洞，部分厂商提供了解决方案。 **关于这个漏洞的原理以及利用演示请参见我的上一篇博客：[Meltdown漏洞解析及Linux开源POC演示](https://blog.hackerchai.com/meltdown-exploit-on-linux-opensource/)**

漏洞检测
====

Windows
-------

Windows客户，通过使用微软公司发布的检测PowerShell脚本，能够判断Windows系统是否受漏洞影响。

*   首先，需要安装相应的PowerShell模块，对应命令：`PS> Install-Module SpeculationControl`
*   其次，需要调用相应脚本，对应命令：`PS> Get-SpeculationControlSettings`
*   其中，开启的保护会显示为True，未开启的保护则会显示为False，如下图所示：

![](https://blog.cdn.hackerchai.com/images/2018/01/window-meltodwn-test.webp)

Linux
-----

参见开源检测项目[Spectre & Meltdown Checker](https://github.com/speed47/spectre-meltdown-checker) 将项目clone下来：

```bash
$ git clone https://github.com/speed47/spectre-meltdown-checker
```

进入项目文件夹，用管理员权限运行脚本：

```bash
$ cd spectre-meltdown-checker
$ sudo ./spectre-meltdown-checker.sh
```

![](https://blog.cdn.hackerchai.com/images/2018/01/linux-meltodwn-test.webp)

结果一目了然

Intel CPU漏洞修复
=============

Windows
-------

微软官方给出的安全建议：[Protect your Windows devices against Spectre and Meltdown](http://https://support.microsoft.com/en-us/help/4073757/protect-your-windows-devices-against-spectre-meltdown "Protect your Windows devices against Spectre and Meltdown")

### Windows系统更新

获取Windows1月8日的更新，如果你是Windows10的话，那么这个更新的代号叫做[KB4056892](http:https://support.microsoft.com/en-us/help/4056892// "KB4056892") 具体方法：选择“开始” 按钮，然后依次选择“设置” >“更新和安全” >“Windows 更新”。选择“检查更新”。如果有可用更新，请安装它们。 
![](https://blog.cdn.hackerchai.com/images/2018/01/meltdown-patch.webp)

更新后请重启再运行检查脚本，看到类似于下图，这个意思是说 Meltdown补丁已经成功，但是Spectre漏洞修复不完整。红色的文字内容是指改名用户还是需要额外的芯片组固件更新。如果用户的笔记本电脑/台式机/服务器供应商提供了额外的芯片组固件更新，他们可以从官方站点获取，安装并完成修补程序。 
![](https://blog.cdn.hackerchai.com/images/2018/01/meltdown-patched.webp)

### BIOS芯片组固件升级

可以在这个页面查询你的主板提供商（List of OEM /Server device manufacturers）：[Protect your Windows devices against Spectre and Meltdown](http://https://support.microsoft.com/en-us/help/4073757/protect-your-windows-devices-against-spectre-meltdown "Protect your Windows devices against Spectre and Meltdown") 以我自为例，我找到Lenovo后，追踪链接，在[下载页面](https://support.lenovo.com/us/zh/solutions/len-18282#ideapad)搜索自己电脑的型号**R720-15IKBN**，然后下载对应的 .exe 文件。
![](https://blog.cdn.hackerchai.com/images/2018/01/2018-01-17-01-43-47-screenshot.webp)

最后双击这个文件，按提示一路重启就可以完成BIOS的固件更新。
![](https://blog.cdn.hackerchai.com/images/2018/01/windows-meltdown-fix.webp)

再次运行测试，结果如上，就此完成Windows上对于次漏洞的修复。

Ubuntu (Linux)补丁
----------------

这里以我自己的Ubuntu为例，介绍如何修补漏洞。其他发行版大同小异，主要留意官方社区对于漏洞的修补工作进度和新发行内核等。 这里需实时关注[SecurityTeam/KnowledgeBase/SpectreAndMeltdown - Ubuntu Wiki](http:https://wiki.ubuntu.com/SecurityTeam/KnowledgeBase/SpectreAndMeltdown?_ga=2.85737308.439532818.1516098621-1958454140.1515318461// "SecurityTeam/KnowledgeBase/SpectreAndMeltdown - Ubuntu Wiki")来获取最新的漏洞修复情况 
![](https://blog.cdn.hackerchai.com/images/2018/01/2018-01-17-01-04-24-screenshot.webp)

### 安装新版本内核

为了修补漏洞，Linux内核团队将 [内核页表隔离](http://https://zh.wikipedia.org/zh-hans/%E5%86%85%E6%A0%B8%E9%A1%B5%E8%A1%A8%E9%9A%94%E7%A6%BB "内核页表隔离")（[PTI](http://https://en.wikipedia.org/wiki/PTI "PTI")）和 [IBRS patch series](http://https://lwn.net/Articles/743019/ "IBRS patch series") 两项技术加入内核之中来对抗Meltdown和Specture。 用户只需要将系统升级到长期发行版本（LTS）或者现在正在迭代周期的系统（Artful 17.10 ）即可获得更新。 
![](https://blog.cdn.hackerchai.com/images/2018/01/2018-01-14-00-28-42-screenshot.webp)]

打开终端输入：

```bash
$ sudo apt-get update
$ sudo apt-get dist-upgrade
```

**PS：由于现在ubuntu系统的Specture漏洞补丁还在测试阶段，所以需要开启 [Pre-released updates（proposed）](https://wiki.ubuntu.com/Testing/EnableProposed)才能安装测试内核，等到正式内核释出在更新正式版，具体方法在前面的链接中，不再赘述，适合有一定Linux基础的人。** 重启在进入系统，执行`uname -r`即可看到内核版本更新。

### 安装Intel微指令更新

终端执行：

```bash
$ sudo apt-get install intel-microcode //如果没有的话
$ sudo apt-get dist-upgrade
```

此时再重新执行测试脚本，你会发现原来的VULNERABLE都变成NOT VULNRERABLE 
![](https://blog.cdn.hackerchai.com/images/2018/01/2018-01-17-01-04-03-screenshot.webp)

Nvidia显卡驱动
----------

由于Nvidia使用了爆出漏洞的ARM架构芯片，所以NVIDIA也及时的为自家显卡打上补丁。

### Windows

[Product Security](http://https://www.nvidia.com/en-us/product-security/ "Product Security")。并前往[驱动程序 | GeForce](https://www.geforce.cn/drivers// "驱动程序 | GeForce")下载对应显卡的最新驱动。

### Ubuntu (Linux)

对于ubuntu，在终端执行：

```bash
$ sudo apt-get update nvidia-384
```

更新最新的384.11版本驱动，即可。

总结
==

这次漏洞的修补工作目前没有比较好的脚本和杀毒软件支持，所以需要大家自行修复，可能需要一些技术基础。希望大家能尽快修复，以免带来更多损失。