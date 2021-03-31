---
title: 为一加7无损转换F2FS文件系统
date: 2019-12-09 00:52:00
tags:
  - oneplus7
  - 刷机
  - 性能优化
  - Android
categories:
  - 折腾
gitmentId: /enable-oneplus7-f2fs/
aliases: 
  - /enable-oneplus7-f2fs
toc: true
draft: false
description: 一加7手机上使用最新的文件系统F2FS最佳实践，使用Arter97内核
---

# F2FS为何物

### F2FS

> **F2FS**（英语：**Flash-Friendly File System**）是一种[闪存文件系统](https://zh.wikipedia.org/wiki/快閃記憶體檔案系統)，主要由[金载极](https://zh.wikipedia.org/w/index.php?title=金載極&action=edit&redlink=1)（韩语：김재극）在[三星集团](https://zh.wikipedia.org/wiki/三星集团)研发，适合[Linux内核](https://zh.wikipedia.org/wiki/Linux内核)使用[[3\]](https://zh.wikipedia.org/wiki/F2FS#cite_note-3)。
>
> 此文件系统起初是为了[NAND闪存](https://zh.wikipedia.org/wiki/闪存)的存储设备设计（诸如[固态硬盘](https://zh.wikipedia.org/wiki/固态硬盘)、[eMMC](https://zh.wikipedia.org/wiki/多媒體記憶卡)和[SD卡](https://zh.wikipedia.org/wiki/SD卡)），这些设备广泛存在于自[移动设备](https://zh.wikipedia.org/wiki/移动设备)至[服务器](https://zh.wikipedia.org/wiki/服务器)领域。
>
> 三星应用了日志结构文件系统的概念，使它更适合用于存储设备。

### 特性

> - 多头日志（Multi-head logging）
> - 对目录项的多层哈希表
> - 静态/动态冷热数据分离
> - 自适应记录方案
> - 可配置操作单元
> - 双检查点
> - 回滚和前滚恢复
> - Heap-style块分配
> - [TRIM/FITRIM](https://zh.wikipedia.org/wiki/Trim命令)支持[[4\]](https://zh.wikipedia.org/wiki/F2FS#cite_note-4)
> - 联机的文件系统/文件[碎片整理](https://zh.wikipedia.org/w/index.php?title=碎片整理&action=edit&redlink=1)[[5\]](https://zh.wikipedia.org/wiki/F2FS#cite_note-5)
> - 内联xattrs[[6\]](https://zh.wikipedia.org/wiki/F2FS#cite_note-6)/数据[[7\]](https://zh.wikipedia.org/wiki/F2FS#cite_note-7)/目录[[8\]](https://zh.wikipedia.org/wiki/F2FS#cite_note-8)
> - 脱机[文件系统检查](https://zh.wikipedia.org/w/index.php?title=Filesystem_check&action=edit&redlink=1)（检查和修复不一致）[[9\]](https://zh.wikipedia.org/wiki/F2FS#cite_note-9))
> - [线性一致性](https://zh.wikipedia.org/wiki/线性一致性)[[10\]](https://zh.wikipedia.org/wiki/F2FS#cite_note-10)
> - [文件系统级加密](https://zh.wikipedia.org/w/index.php?title=文件系统级加密&action=edit&redlink=1)[[11\]](https://zh.wikipedia.org/wiki/F2FS#cite_note-11)
> - 脱机调整大小[[12\]](https://zh.wikipedia.org/wiki/F2FS#cite_note-12)
> - 内部定期数据刷新[[13\]](https://zh.wikipedia.org/wiki/F2FS#cite_note-13)
> - 范围缓存[[14\]](https://zh.wikipedia.org/wiki/F2FS#cite_note-14)

### 香在哪里

目前笔者的`oneplus7`所可以使用的第三方内核中，大部分都支持了`F2FS`的驱动，在[XDA](https://forum.xda-developers.com/oneplus-7-pro/development)论坛中，有一个关于`oneplus7 pro`使用Kirisakura内核并且开启`/data`分区`F2FS`的[测评](https://forum.xda-developers.com/showpost.php?p=79603954&postcount=4)，相对于原来的EXT4文件系统有了比较大的提升，尤其是在随机写入、数据库相关性能中有了甚至几倍的提升

![EXT4性能测试](/images/2019/12/compare-ext4-performance.webp)

![F2FS性能测试](/images/2019/12/compare-f2fs-performance.webp)

在作者的是实际使用中，能够明显的感觉到`F2FS`文件系统带来的应用启动速度的提升，再有就是更小的电量消耗（可能与笔者使用的[arter97](https://forum.xda-developers.com/showpost.php?p=79603954&postcount=4)内核有关）简直不要再香，闲话少叙，我们赶快来试试

**/* Disclaimer */**

**/* 声明 */**

**Your warranty is now void.**
**I am not responsible for bricked devices, dead SD cards, data loss**

**我将不为变砖的设备，损坏的存储设备，数据的丢失负责任**


# 无损转换的操作过程

### 前期准备

1.  首先你要确定的是你的op7手机已经解锁`Bootloader`（**您会丢失所有的数据，请谨慎选择**）并且您拥有一个可以运行`ADB`命令的电脑，这个可以在这篇[文章](https://www.oneplusbbs.com/thread-4796616-1.html)中找到，不过多赘述
2.  确保你的手机系统版本为一加原生系统（[氧OS](https://www.oneplus.com/cn/oxygenos)/[氢OS](https://www.h2os.com/)）并且保证系统使用最新的`Android 10`，也就是说在设置里面看到的系统版本主版本号要是10（形如10.x.x）
3.  为手机安装支持`Android 10`的[TWRP](https://twrp.me/)，这里我们使用[mauronofrio](https://forum.xda-developers.com/member.php?u=4712355)维护的版本（[地址](https://forum.xda-developers.com/oneplus-7/oneplus-7--7-pro-cross-device-development/recovery-unofficial-twrp-recovery-t3932943)）
   - 打开上述项地址，下载带有`Unoffical Q`字样的最新版本，截至目前最新的版本是 [74](https://www.androidfilehost.com/?fid=4349826312261638736)，下载后将img文件存储备用
   - 终端中打开上述文件存储目录，并将你的手机进入Fastboot模式，这个操作您可以在[这里](https://www.oneplusbbs.com/thread-4796616-1.html)找到，用USB线缆链接电脑
   - 输入 `fastboot boot recoveryimgfilename.img` 替换其中的文件名为还真实文件名，此时你的手机会暂时进入一个`TWRP`的界面，如果您想**永久刷入**的话还需要执行下一步操作
   - 将刚才的img文件通过电脑上的MTP协议拷贝到手机SD卡根目录，打开`TWRP`的高级（Advance）菜单，选择`Install Recovery Ramdisk`选项，选择刚才的img文件，刷入，至此您就完成了`TWRP`的刷入
   - **此时我们还需要一个必要操作！**如果此时重启我们是没法进入系统的，无论您之前是否安装`Magisk`，您都要重新刷入一次`Magisk`的ZIP包，如果您不了解还是可以参照这篇[文章](https://www.oneplusbbs.com/thread-4796616-1.html)，这里模块的下载我推荐使用最新版本的，[下载地址](https://forum.xda-developers.com/apps/magisk/official-magisk-v7-universal-systemless-t3473445)
4.  安装`Magisk`模块，由于在上一步骤已经做过，故不需要重复操作
5.  在这里笔者使用的是[arter97](https://forum.xda-developers.com/oneplus-7/oneplus-7-7-pro-7t-7t-pro-cross-device-kernel-development/arter97-kernel-oneplus-7-t3952578)内核，当然你也可以选择其他支持`F2FS`的第三方内核，基本上`XDA`的现有第三方内核中我觉得在流畅度还是省电，最好的还是这款，所以以下教程也围绕这个内核来展开，其他内核的操作大同小异，如果是有经验的机友可以使用其他内核进行尝试，这里同样推荐另外一款内核[Kirisakura](https://forum.xda-developers.com/oneplus-7-pro/development/kernel-kirisakura-1-0-0-op7-pro-aka-t3933916)
   - 下载最新版本的内核，传输到手机任意目录
   - 启动到`Recovery`刷入刚在的ZIP文件
   - 清除`Dalvik Cache`
   - 重启

6.  最后我们再一次启动进入Recovery界面

### 备份操作
为了转换系统过后我们不丢失APP和用户数据我们需要对`/data`分区和`sdcard`进行备份

1. `Restore > data` 首先备份data分区，进入备份，选择`data`分区，在高级选项中我推荐勾选压缩（compression），这样虽然时间长一点但是有利于传输电脑，同时我也推荐勾选检验选项（digest），防止传输出现问题所导致的数据丢失

2. 然后备份sdcard，使用电脑终端运行`adb`命令 `adb pull /data/media sdcard_backup` 此时电脑上的文件`sdcard_backup` 一定要保存好，此时第一步备份的data分区已经包含在sdcard的文件中（/TWRP/BACKUP/***）

### 修改文件系统
1. `Wipe > Advanced Wipe > Data > Repair or Change File System > Change File System > F2FS` 选择`清除`选项，`高级清除`，选择data分区，选择`修改或修复文件系统`，选择`修改文件系统`，点击`F2FS`

2. 此时查看一下`data`分区是否为`F2FS`，如果是请重启一次Recovery，再次进入Recovery（具体操作`Reboot > Recovery` 选择重启选项，选择`Recovery` ）

### 还原操作
1. 使用电脑终端运行`adb`命令 `adb push sdcard_backup /data/media/0/` 稍等片刻，此时你会看到原来`sdcard`上所有的目录都回来了
2. `Setting > use rm-rf  instead of formattting` 在 TWRP 的设置中，把 “使用 rm-rf 指令代替格式化” 的选项勾上，以免一会还原分区时候系统执行`wipe`把分区再次格式化为`EXT4`
3. `Restore > Choose backup > Data` 选择`恢复`，选择相应的备份，然后确定，此时如果看到警告（WARNING）提示你使用`EXT4`备份还原`F2FS`分区，可以直接忽略
4. 结束后如果没有报错的话我们继续最后一部

### 刷入优化驱动
如果内核支持`F2FS`驱动的话其实到这里就应该结束了，不过`arter97`内核在这里做了一个优化，我们需要刷入

1. 在[这里](http://arter97.com/browse/f2fs/optimize/)下载优化包，`MTP`传输到手机sdcard中
2. `Install > f2fs-optimize.zip` 在`Recovery中安装刚才的ZIP包

至此，我们完成了所有的转换步骤，重启手机到系统中去体验F2FS带来的快速吧，奥里给！

