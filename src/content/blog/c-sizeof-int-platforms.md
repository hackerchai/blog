---
title: 数据类型对应字节数（32位，64位 int 占字节数）
author: Eason Chai
pubDatetime: 2014-10-11T22:06:52Z
tags:
  - C
  - 数据结构
slug: c-sizeof-int-platforms
toc: true
draft: false
featured: false
description: C语言下各个平台不同数据结构占用内存
---

最近在备战NOIP提高组初赛，突然发现了这个问题，贴出来

一. 程序运行平台 不同的平台上对不同数据类型分配的字节数是不同的。

个人对平台的理解是CPU+OS+Compiler，是因为：

1. 64位机器也可以装32位系统;

2. 32位机器上可以有16/32位的编译器(XP上有tc是16位的，其他常见的是32位的);

3. 即使是32位的编译器也可以弄出64位的integer来(int64);

以上这些是基于常见的windows平台，加上我们可能很少机会接触的其它平台（其它的CPU和OS），所以个人认为所谓平台的概念是三者的组合。 虽然三者的长度可以不一样，但显然相互配合（即长度相等，32位的CPU+32位的OS+32位的Compiler）发挥的能量最大。 理论上来讲 我觉得数据类型的字节数应该是由CPU决定的，但是实际上主要由编译器决定(占多少位由编译器在编译期间说了算)。

二. 常用数据类型对应字节数 可用`sizeof()`等得出:

32位编译器：

- char ：1个字节
- char\*（即指针变量）: 4个字节（32位的寻址空间是2^32, 即32个bit，也就是4个字节。同理64位编译器）

- short int : 2个字节
- int： 4个字节

- unsigned int : 4个字节

- float: 4个字节

- double: 8个字节

- long: 4个字节

- long long: 8个字节

- unsigned long: 4个字节

64位编译器：

- char ：1个字节
- char\*(即指针变量): 8个字节
- short int : 2个字节
- int： 4个字节
- unsigned int : 4个字节
- float: 4个字节
- double: 8个字节
- long: 8个字节
- long long: 8个字节
- unsigned long: 8个字节
