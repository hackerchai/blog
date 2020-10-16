---
title: 10分钟解惑C语言指针
tags:
  - c
  - data structure
  - pointer
  - 指针
  - 数据结构
categories:
  - C
  - 数据结构
  - 算法
date: 2014-12-12 14:25:56
gitmentId: /c-language-pointer/
aliases: 
  - /c-language-pointer
toc: true
draft: false
description: 深入浅出语言指针
---

前言
==

最近才在备战OI，我之前对C指针的理解是：指针本身是一块内存，它保存了一块内存的地址，但是经常对一些概念有混淆，于是今天就细致的研究了一下指针的详细用法和原理。

指针
==

先看这样一段代码：

```C
#include <stdio.h>
int main()
{
        int i = 10;
        int * p;
        printf("p的地址:%d\n",&p);
        printf("未初始化时p的内容:%d\n",p);
        p = &i;
        printf("--初始化p完毕--\n");
        printf("p里面保存的地址:%d\n",p);
        printf("p指向的内存的内容:%d\n",*p);
        printf("p的大小:%d\n",sizeof(p));
        printf("p指向的内存大小:%d\n",sizeof(*p));
        return 0;
}
```

输出结果为：

```
p的地址:1439276008
未初始化时p的内容:0
--初始化p完毕--
p里面保存的地址:1439276020
p指向的内存的内容:10
p的大小:8
p指向的内存大小:4
```

这就是指针的基本使用，可用下图来说明:
![c-pointer](https://cdn.jsdelivr.net/npm/hackerchai@0.3.0/blog/images/2014/12/c-pointer.webp)

指针与数组
=====

首先看这两个声明语句

```C
char (*a) [100];
char* a [100];
```

第一个是声明了一个指向有100个char元素的数组的指针（注意和指向数组首地址的char型指针分开）；第二个是声明了一个有100个char*元素的数组，数组里面装的是char *。 为了理解，我们来看这样一段代码：

```C
#include <stdio.h>

int main()
{
        int arr[10][100];
        printf("sizeof(arr[0]) = %lu\n", sizeof(arr[0]));
        printf("sizeof(arr[0][0]) = %lu\n", sizeof(arr[0][0]));
        int *p;
        int (*q)[100];
        p = &arr[0][0];
        q = &arr[0];
        printf("p = %d\n",p);
        printf("q = %d\n",q);
        printf("sizeof((*p)) = %lu\n", sizeof((*p)));
        printf("sizeof((*q)) = %lu\n", sizeof((*q)));
        p++;
        q++;
        printf("after add 1, p = %d\n", p);
        printf("after add 1, q = %d\n", q);
        return 0;
}
```

这端代码运行后结果如下：

```
sizeof(arr[0]) = 400
sizeof(arr[0][0]) = 4
p = 1411443800
q = 1411443800
sizeof((*p)) = 4
sizeof((*q)) = 400
after add 1, p = 1411443804
after add 1, q = 1411444200
```

因为内存是线性的，C中所谓的二维数组不过是数组的数组，arr这个数组有10个元素，每个元素是一个长度为100的数组，在程序员的脑子里面，arr是一个有10行100列的二维数组。 代码里的p是一个指向int型的指针，q是一个指向“有100个int的int数组”的指针。所以p和q的初始化方式是不同的，但是开始的时候他们都指向了arr这个数组的数组的首地址（初始时是相等的），但是到后面分别执行自增操作之后，因为它们的类型不同，因此根据指针自增运算的含义，他们移动的步长也不相同，p移动了sizeof(int)个字节，而q移动了sizeof(int[100])个字节，于是它们的值也大不相同，可以用下图来说明： 
![c-pointer-array](https://cdn.jsdelivr.net/npm/hackerchai@0.3.0/blog/images/2014/12/c-pointer-array.webp)

另外要注意的就是字符二维数组的声明：

```C
#include <stdio.h>

int main()
{
        char* str[2] = {"hackerchai","hi"};
        printf("%s %s\n",str[0],str[1]);
        return 0;
}
```

输出结果显然

```
hackerchai hi
```

以上是合法的字符二维数组的声明，str是一个有两个元素的数组，每个元素的类型是一个char*，结合上面所讲的，应该不难理解。 #通过函数指针调用函数 还是通过一个例子来说明问题：

```C
#include <stdio.h>

void printMyName();

int main()
{
        void (*f)();
        f = printMyName;
        f();
        f = &printMyName;
        f();
        return 0;
}

void printMyName()
{
        printf("hackerchai\n");
}
```

**注意用“&函数名”和“函数名”初始化一个函数指针都是合法的，因为C中函数名会被转换为指向这个函数的指针。** 本人平时打OI，指针真的用的少之又少，今天算是给自己科普一下

