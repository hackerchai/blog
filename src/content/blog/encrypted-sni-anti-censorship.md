---
title: ESNI和加密DNS - 保护信息隐私的最后一块拼图
author: Eason Chai
tags:
  - Censorship
  - DoH
  - DoT
  - ESNI
  - Firefox
  - HTTPS
  - IETF
  - Mozilla
  - Privacy
  - TLS1.3
  - 网络审查
  - 隐私保护
pubDatetime: 2019-02-26T20:53:30Z
postSlug: encrypted-sni-anti-censorship
draft: false
featured: true
description: 通俗移动的ESNI原理讲解，用ESNI保护隐私和对抗信息审查
---

## Table of contents

# ESNI

随着[TLS1.3](https://www.ietf.org/blog/tls13/)的发布，让该协议成为有史以来最安全、也是最复杂的TLS协议。在该协议之中，有很多的对于以往协议安全漏洞的修复，包括废弃RSA启用新的秘钥交换机制PSK等等。而`Encrypted SNI`作为一个`TLS1.3`的扩展协议用来防止传统的HTTPS流量受到ISP或者陌生网络环境的窥探以及一些网络审查。在过去，由于`HTTPS`协议之中`Server Name Indication - SNI`的使用，我们的HTTPS流量经常被窥探我们所访问站点的域名

# 什么是Encrypted SNI

### 那么什么是SNI？

> 服务器名称指示（英语：Server Name Indication，简称SNI）是一个扩展的TLS计算机联网协议，在该协议下，在握手过程开始时客户端告诉它正在连接的服务器要连接的主机名称。这允许服务器在相同的IP地址和TCP端口号上呈现多个证书，并且因此允许在相同的IP地址上提供多个安全（HTTPS）网站（或其他任何基于TLS的服务），而不需要所有这些站点使用相同的证书。它与HTTP/1.1基于名称的虚拟主机的概念相同，但是用于HTTPS。所需的主机名未加密， 因此窃听者可以查看请求的网站 为了使SNI协议起作用，绝大多数访问者必须使用实现它的Web浏览器。使用未实现SNI浏览器的用户将被提供默认证书，因此很可能会收到证书警告

- SNI协议示意图

![SNI协议](https://blog.cdn.hackerchai.com/images/2019/02/sni.webp "SNI协议")

- TLS1.3完整握手流程

![TLS1.3完整握手流程](https://blog.cdn.hackerchai.com/images/2019/02/tls13_procedure.webp)

### 为了弥补缺陷因应运而生的ESNI

在上述过程之中，存在的问题就是，在ClientHello环节中，TLS会在这个位置以**明文**的形式讲要请求的Host写在数据包之中，如果在网络路由中有任何的监听节点，那么用户所访问网站的域名将暴露无遗，这将是巨大的用户隐私泄露:
![明文SNI](https://blog.cdn.hackerchai.com/images/2019/02/Cloudflare_https_with_plaintext_dns_tls12_plaintext_sni.webp)

所以在最新的关于[ESNI的草案](https://tools.ietf.org/html/draft-rescorla-tls-esni-00)中，`IETF`重新设计了一种加密的Client Hello机制，从而修复了这个问题:
![ESNI](https://blog.cdn.hackerchai.com/images/2019/02/Cloudflare_https_with_secure_dns_tls13_encrytped_sni-1.webp)

**不过这里问题又来了，之前服务器和客户端并没有事先交换任何数据啊，这个加密的凭证从何而来啊？？？**

### 依靠安全DNS的ESNI

上一个问题没有难倒工程师们，他们设计了这样一个办法。首先让网站提供者在DNS提供商上公布一个记录，这个记录包含着一个`公钥`，这个公钥由网站提供者生成，其`私钥`存储在Web服务器等待着被Web程序读取。如此，当用户想通过TLS1.3协议访问这个域名的时候，首先读取这个公开的公钥，在用公钥加密其想访问的`域名Host`，装在`Client Hello`里面发送给目标服务器，目标服务器再用自己的私钥解密，从而和用户建立HTTPS链接，这样就不会暴露Host信息 这时候有人会想，如果有人某Wall想给你的DNS偷天换日，那会不会很不安全啊,请继续向下看

# 加密DNS

在`ESNI`的实现草案之中，里面要求`安全加密的DNS`**是推荐的**。大家都知道我们的DNS查询一般是`TCP`报文或者是`UDP`报文，本身它是不加密的，所以如果有人想在篡改你的DNS是相对简单的，大家可能都知道我们伟大的妨炎蔷会使用DNS污染的方式干扰一些网站的正常访问。正式由于DNS的非加密性，DNS也成为了审查信息的利器。此时加密的DNS势在必行

### DNS over TLS (DoT) and DNS over HTTPS (DoH)

于是出现了这两种新型的DNS查询方式

- DNS over HTTPS (DoH)

> DNS Over HTTPS (DOH) 是一个进行安全化的域名解析的方案，当前尚处于实验性阶段。其意义在于以加密的HTTPS协议进行DNS解析请求，避免原始DNS协议中用户的DNS解析请求被窃听或者修改的问题（例如中间人攻击）来达到保护用户隐私的目的。 Google及Mozilla基金会正在测试这一协议，作为其提高网络安全性的努力的一部分。 当前，该方案由IETF支持，其规范文档以 RFC 8484 的名义发布。2018年9月5日发布的Firefox 62正式版加入了这项功能，但需要用户手动开启 DNS Over HTTPS利用HTTP协议的GET命令发出经由JSON等编码的DNS解析请求。较于传统的DNS协议，此处的HTTP协议通信处于具有加密作用的SSL/TLS协议（两者统称作HTTPS）的保护之下。但是，由于其基于HTTPS，而HTTPS本身需要经由多次数据来回传递才能完成协议初始化，其域名解析耗时较原DNS协议会显著增加。 传统的DNS协议形成于互联网早期，直接基于UDP或TCP协议，且彼时未虑及现代安全性的需要，未利用密码学等手段进行加密或验证。因而，其无法抵御现代互联网常见的DNS投毒污染等攻击手段或监听。虽然后来的DNSSEC方案通过电子签名进行验证，强化了DNS的安全性，并能够抵御DNS投毒污染等篡改通信的手段，但其对于中间网络设备进行的监听仍然没有抵御能力（随后，监听者可以通过获取的通信数据知晓用户访问了哪一域名，而域名往往与具体的网站相关系）。此外，DNSSEC的起效要求现有的大量DNS解析服务的提供商（常为互联网服务提供商或第三方大型互联网机构）对已有的DNS服务器进行大范围修改等问题，其推进进程并不理想。而对于DNS Over HTTPS，在正确部署服务端并妥善配置客户端的前提下，互联网服务提供商或其它中间网络设备无法解密（亦即无法获知请求的实际内容）或者篡改已经加密的HTTPS通信，故其能够有效保护互联网用户的安全及隐私；另一方面，其基于已经成熟并已广泛部署的HTTPS协议，客户端进行利用较为方便。

- DNS over TLS (DoT)

> DNS over TLS (DoT) 是通过传输层安全协议（TLS）来加密并打包域名系统（DNS）的安全协议。此协议旨在防止中间人攻击与控制DNS数据以保护用户隐私。 RFC 7858及RFC 8310定义了DNS over TLS。 截至2018年，Cloudflare、Quad9与CleanBrowsing均向大众提供支持DNS over TLS的公共DNS解析服务。2018年4月，Google宣布Android P将包含对DNS over TLS的支持。PowerDNS的DNSDist也宣布在其最新的1.3.0版本中添加了对DNS over TLS的支持。BIND用户也可以通过stunnel代理提供DNS over TLS服务。

# 利用Firefox Nightly体验ESNI

### 手动配置

Firefox所在的Mozilla宣布从`Firefox 62`版本之后开始支持`ESNI`，默认没有开启，需要用户手动配置打开，那么我们现在试验一下 这里Firefox的解决方案是使用`DNS over HTTPS (DoH)`和`ESNI`

1.  安装`Firefox Nightly`版本，这个版本是预发布版本，使得开发这和即可门可以提前尝鲜到新功能。[下载地址](https://www.mozilla.org/zh-CN/firefox/nightly/all/)

2.  在浏览器地址栏输入`about:config`并回车，打开配置页面，在搜索位置搜索`network.trr.mode`，这个是打开浏览器对于`DoH`的支持，将此项的数值修改为3（`0`对应的是不开启此功能；`1`对应的是交由浏览器选择`DoH`与传统方式那种更快；`2`代表优先使用加密DNS查询，如果失败则回落到普通DNS查询；`3`代表只使用加密DNS查询；`5`代表明确的关闭此功能）

3.  继续搜索`network.trr.uri`，将此项的值修改为`https://mozilla.cloudflare-dns.com/dns-query`，这个是默认的`DoH`查询地址，当然我们也可以使用诸如`https://1.1.1.1/dns-query`、`https://dns.google.com/experimental`这样的地址，我们可以事先`ping`检测一下对比哪个延迟更低来使用

4.  （可选）搜索`network.trr.bootstrapAddress`，讲此值修改位第三步的DNS域名的`IP`。此举是为了避免使用操作系统DNS查询域名受到劫持，一般来说这些DNS的`IP`是不会变的

![Firefox ESNI](https://blog.cdn.hackerchai.com/images/2019/02/firefox-esni-profile.webp)

5.  将`network.security.esni.enabled`设置为`true`,此举为了打开浏览器对于ESNI的支持（感谢[chenlshi](https://github.com/chenIshi)同学的提醒，在原版的文章中我不小心遗漏了这个关键的步骤）

6.  完成配置后重启浏览器，再打开[在线验证页面验证](https://encryptedsni.com/)来查询你的浏览器是否完全支持`ESNI`功能，如果出现如图说明配置成功了

![Firefox ESNI Verify](https://blog.cdn.hackerchai.comhttps://blog.cdn.hackerchai.com/images/2019/02/firefox-esni-verify.webp)

### 验证

为了验证是否真的加密了`Client Hello`，我们使用`Wireshark`进行网络抓包 由于这个特性仍在试验阶段，并没有太多站点支持这个特性，[CloudFlare](https://cloudflare.com)是第一个全站支持`ESNI`的网站，这里我们使用[blog.cloudflare.com](https://blog.cloudflare.com)来做测试：

1.  首先打开`Wireshark`的抓包功能，然后开启`Chrome`浏览器打开上述网址，页面加载完后停止抓包，在得到的结果中查询协议为`TLS1.3`和报文为`Client Hello`的报文，通过观察发现域名的Host果然被以明文形式写在数据包中（参见`Server_Name`字段）：

![Wireshark抓包 明文SNI](https://blog.cdn.hackerchai.com/images/2019/02/cloudflare-wireshark-no-esni.webp)

2.  然后打开`Firefox Nightly`浏览器重复上述操作，这次发现在整个数据包中根本找不到`Server_Name`字段，说明`Host`已经被加密：

![Wireshark抓包 ESNI](https://blog.cdn.hackerchai.com/images/2019/02/cloudflare-wireshark-esni.webp)

# Nginx/Apache支持以及展望

目前来说，我查阅了相关的关键词，仍然没有任何一篇教程有介绍如何在自己的服务器上支持`ESNI`，同时我也看到在`Nginx`的论坛里面有人呼吁尽快支持`ESNI`，所以我推测这个功能仍然在试验期，还没有被这两个Web软件所支持，起劲为止我也没有查阅到任何的Web软件预计支持此项功能。这项扩展已经进入`IETF`的草案阶段，可以预见到，在不就的将来，这项技术可以普及开来，为我们的网络隐私保驾护航 目前来说，有了`HTTPS`+`TLS1.3`+`ESNI`+`DoH/DoT`的加持，我们的网络隐私的到了极大的保障，最后还有一个问题是访问服务器`IP`的泄露仍然无法被避免，迫于`IP协议`设计的机制，他目前还不能被解决。不过我相信，随着网技术不断的趋于保护个人隐私和更快速的发展方向，这个问题可以最终被解决
