---
title: 写一个自动短信提醒足球比赛的Python脚本
author: Eason Chai
tags:
  - bash
  - Linux
  - python
  - 脚本
  - 足球
pubDatetime: 2018-02-05T21:29:04Z
slug: soccer-dog-sms-reminder-python
draft: false
featured: true
description: 使用Python2编写的自动短信提醒足球赛脚本，使用urllib
---

## Table of contents

## 前言

博主是一个狂热的足球粉&巴萨死忠，所以每天半夜干的最多的就是看比赛。可是经常学业一忙起来，有时候会差点错过比赛。于是在假期抽出一天时间用Python写了一个可以自动提醒即将到来球赛的Python脚本 [soccer_dog_reminder](https://github.com/hackerchai/soccer_dog_reminder/)

## 截图

--

![](https://blog.cdn.hackerchai.com/images/2018/02/soccer-dog-sms-screenshot.webp)

![](https://blog.cdn.hackerchai.com/images/2018/02/soccer-dog-reminder-result.webp)

## 实现

整个项目分成两个部分，一部分是获取俱乐部未来的赛程信息，然后推算出下一场最近的比赛日期和时间；另一部分就是将获取的信息格式化后利用短信接口发送到制定的手机号码，逻辑上并不难，于是开工。

### 1.足球赛事接口实现

一开始我想用巴塞罗那官网的日程日历解析的方式来实现这个功能，但是后来无意中搜索到有直接写好的足球赛事API可以查询，最后选中了其中做的比较大比较完备的一家[聚合数据](https://www.juhe.cn/docs/api/id/90)，其中的的球队赛事查询恰好符合我的需求。其中的请求API如下： 接口地址：http://op.juhe.cn/onebox/football/team

- 返回格式：`json/xml`

- 请求方式：`GET/POST`

- 请求示例：http://op.juhe.cn/onebox/football/team?key=APPKEY&team=%E7%9A%87%E9%A9%AC

| 名称  | 类型   | 必选 | 说明                                     |
| ----- | ------ | ---- | ---------------------------------------- |
| key   | string | 是   | 应用`APPKEY`(应用详细页查询)             |
| dtype | string | 否   | 返回数据的格式,`xml`或`json`，默认`json` |
| team  | string | 是   | 球队名称                                 |

于是我们根据API构建`GET`请求，这里用到了Python的网络请求`urllib`库，在这里简要介绍这个库的使用

### Python网络请求库的使用

这里为了完成我们所需要的请求，我们用到了`urllib`和`urllib2`两个库，注意这两个库可怒视什么重复引用，在Python2.7下这两个库更像是一个补充：

- `urllib2`可以接受一个`Request`对象，并以此可以来设置一个URL的headers，但是`urllib`只接收一个URL。这意味着，你不能伪装你的用户代理字符串等

- `urllib`模块可以提供进行`urlencode`的方法，该方法用于GET查询字符串的生成，`urllib2`的不具有这样的功能。这就是`urllib`与`urllib2`经常在一起使用的原因

下面让我们看看这两个库的基本常用函数和用法：

- urllib2.urlopen(url\[, data\[, timeout\[, cafile\[, capath\[, cadefault\[, context\]\]\]\]\])

`urlopen`方法是`urllib2`模块最常用也最简单的方法，它打开URL网址，url参数可以是一个字符串url或者是一个`Request`对象。URL没什么可说的，`Request`对象和`data`在`request`类中说明，定义都是一样的 对于可选的参数`timeout`，阻塞操作以秒为单位，如尝试连接（如果没有指定，将使用设置的全局默认timeout值） 先看只包含URL的请求例子：

```python
import urllib2
response = urllib2.urlopen('https://hackerchai.com')
html = response.read()
```

`urlopen`方法也可通过建立一个`Request`对象来明确指明想要获取的url。调用`urlopen`函数对请求的url返回一个`response`对象。这个`response`类似于一个file对象，所以用`.read()`函数可以操作这个`response`对象

```python
import urllib2
request = urllib2.Request('https://hackerchai.com')
response = urllib2.urlopen(request)
the_page = response.read()
```

当然`Request`函数还有更多的参数，下面来介绍： 一般来说我们常用的参数还有`data`，它是一个字符串，指定额外的数据发送到服务器，如果没有`data`需要发送可以为`“None”`，这时候的服务器请求为`GET`。目前使用data的`HTTP`请求是唯一的。当请求含有data参数时，HTTP的请求为`POST`，而不是`GET`。数据应该是存储在一个标准的`application/x-www-form-urlencoded`格式中。可以通俗的来说，比如：`http://hackerchai.com/get.php?id=1&name=test`这一串请求中，`id=1&name=test`这两个变量就是`GET`请求，`GET`请求都存在于请求的URL中，适合于数据量比较小，可以用简单字符串表达的情形。对于`POST`，例如在网上填的form（表单）时，浏览器会`POST`表单的内容，这些数据需要被以标准的格式编码（encode），然后作为一个数据参数传送给Request对象。而到了比较复杂的请求比如说上传文件或者传输数据比较敏感就需要`POST`来帮忙了（因为POST请求是不被缓存的而且对请求数据长度没有要求） Python中的`urllib`库提供了编码url的函数`urlencode`，下面让我们看看到底如何发起一个`POST`请求：

```python
import urllib
import urllib2

url = 'http://www.someserver.com/cgi-bin/register.cgi'
values = {'name' : 'Michael Foord',
          'location' : 'Northampton',
          'language' : 'Python' }

data = urllib.urlencode(values)
req = urllib2.Request(url, data)
response = urllib2.urlopen(req)
the_page = response.read()
```

因为在后面的API中我们还会用到header参数的添加，所以这里也进行讲解： `headers`是字典类型，头字典可以作为参数在~时直接传入，也可以把每个键和值作为参数调用~方法来添加。作为辨别浏览器身份的`User-Agent header`是经常被用来恶搞和伪装的，因为一些`HTTP`服务只允许某些请求来自常见的浏览器而不是脚本，或是针对不同的浏览器返回不同的版本。例如，Mozilla Firefox浏览器被识别为`“Mozilla/5.0 (X11; U; Linux i686) Gecko/20071127 Firefox/2.0.0.11”`。默认情况下，`urlib2`把自己识别为`Python-urllib/x.y`（这里的xy是python发行版的主要或次要的版本号，如在Python 2.6中，`urllib2`的默认用户代理字符串是“Python-urllib/2.6。下面的例子和上面的区别就是在请求时加了一个`headers`，模仿IE浏览器提交请求，使用的是作为参数在`request`中直接传递：

```python
import urllib
import urllib2
url = 'http://www.someserver.com/cgi-bin/register.cgi'
user_agent = 'Mozilla/4.0 (compatible; MSIE 5.5; Windows NT)'
values = {'name' : 'Michael Foord',
          'location' : 'Northampton',
          'language' : 'Python' }
headers = { 'User-Agent' : user_agent }
data = urllib.urlencode(values)
req = urllib2.Request(url, data, headers)
response = urllib2.urlopen(req)
the_page = response.read()
```

当然也可以`Request`对象调用`add_header(key, val)`方法附加`header`

```python
import urllib2
req = urllib2.Request('http://www.example.com/')
req.add_header('Referer', 'http://www.python.org/')
r = urllib2.urlopen(req)
```

至此我们构建出`POST`请求之后发现，返回的请求输出是一段`JSON`，这里又要用到`JSON`格式的解析

### Python中Json类库的使用

> JSON(JavaScript Object Notation) 是一种轻量级的数据交换格式。 易于人阅读和编写。同时也易于机器解析和生成。 它基于JavaScript Programming Language, Standard ECMA-262 3rd Edition - December 1999的一个子集。 JSON采用完全独立于语言的文本格式，但是也使用了类似于C语言家族的习惯（包括C, C++, C#, Java, JavaScript, Perl, Python等）。 这些特性使JSON成为理想的数据交换语言。

Python中的`Json`类库也为我们提供了丰富的操作： 这里主要使用了`json.loads()`对于得到的字符串数据进行解析，得是Python的`object`对象，剩下的就是Python的字典操作和列表操作，不过多赘述 如此完事具备，只欠东风了。于是我们开始编写足球赛事的接口

```python
def club_match_query(football_api_appkey, football_club):
    football_api_url = "http://op.juhe.cn/onebox/football/team"
    football_api_params = {
        "key": football_api_appkey,
        "dtype": "",
        "team": football_club,
    }
    football_api_params = urlencode(football_api_params)
    football_api_request = Request(football_api_url, football_api_params)
    football_api_response = urlopen(football_api_request)
    football_api_content = football_api_response.read()
    football_match_data = json.loads(football_api_content)
    if football_match_data:
        error_code = football_match_data["error_code"]
        football_club_d = football_club.decode("utf-8")
        if error_code == 0:
            # 寻找第一个还未进行的比赛
            for index in range(len(football_match_data["result"]["list"])):
                if football_match_data["result"]["list"][index]["c4R"] == "VS":
                    upcoming_match_id = index
                    break
            match_type = football_match_data["result"]["list"][upcoming_match_id]["c1"]
            match_date = football_match_data["result"]["list"][upcoming_match_id]["c2"]
            match_time = football_match_data["result"]["list"][upcoming_match_id]["c3"]

            if football_match_data["result"]["list"][upcoming_match_id]["c4T1"] == football_club_d:
                match_opponent = football_match_data["result"]["list"][upcoming_match_id]["c4T2"]
            else:
                match_opponent = football_match_data["result"]["list"][upcoming_match_id]["c4T1"]

            print match_type
            print match_date
            print match_time
            print match_opponent

            (match_month, match_day) = match_date.split("-")
            (match_hour, match_minute) = match_time.split(":")

            print match_day
            print match_month
            print match_hour
            print match_minute

            current_time_d = date.today()
            match_time_d = date(int(current_time_d.year), int(match_month), int(match_day))

            gap_time_days = (match_time_d - current_time_d).days

            if gap_time_days <= 1:
                current_time_h = datetime.datetime.now()
                match_time_h = datetime.datetime(int(current_time_h.year), int(match_month), int(match_day),
                                                 int(match_hour), int(match_minute), 0, 0)
                gap_time_seconds = (match_time_h - current_time_h).seconds
                gap_time_days = (match_time_h - current_time_h).days
                gap_time_hours = gap_time_seconds / 3600 + gap_time_days * 24
                print gap_time_hours
                message = "team1:"+football_club + ','  + "team2:"+match_opponent + ',' +"type:" + match_type + ',' + "date:" +match_month + "月" + match_day + "日" + match_hour + "时" + match_minute + "分" + ',' + "hour:" + str(
                    gap_time_hours)
                print message
                return message
            else:
                message = "no recent match"
                return message
        else:
            print "%s:%s" % (football_match_data["error_code"], football_match_data["reason"])
    else:
        print "request football api error"
```

这段代码通过`POST`请求，得到球队赛事的`JSON`数据，再通过接送解析，搜寻还未进行比萨中最近的一场，然后将这个比赛的时间日期经过处理，合成为一个可以接下来可以传入短信接口的字符串，包括了时间日期比赛类型对阵球队以及倒计时小时

### 2.短信发送接口实现

一开始我想选用各大运营商的短信服务，后来综合比较之后发现不够划算，于是我在阿里云云市场发现了这个[【官方106三网短信】短信平台/短信免费试用/短信验证码/短信通知/短信群发推广—短信API接口对接](https://market.aliyun.com/products/56928004/cmapi023305.html?spm=5176.2020520132.101.3.684b72186EMJey#sku=yuncode1730500007)，价格比较划算而且口碑信誉都不错。经过实际使用体验，短信延迟低，售后也很耐心，下面是它的API： 调用地址：[http://dingxin.market.alicloudapi.com/dx/sendSms](http://dingxin.market.alicloudapi.com/dx/sendSms)

- 请求方式：`POST`

- 返回类型：`JSON` 请求参数：

| 名称   | 类型   | 是否必选 | 说明   |
| ------ | ------ | -------- | ------ |
| param  | string | 可选     | 参数   |
| mobile | string | 可选     | 手机号 |
| tpl_id | string | 可选     | 模板号 |

在编写代码之前我们还要向客服协商，制定短信模板（要不然只能选择官方的10套模板），下面贴出我制作的短信模板：

    【足球狗赛事推送】您关注的球队#team1#有比赛啦！#type#对阵#team2# ，时间是#date#，还有#hour#小时开赛

其中`##`代表要填入的参数，上文中的的参数（`param`）就是将希望填入模板数据依次用`,`连接而构成的字符串，由于这个api仅提供`POST`的请求方式，所以在代码上也要做出改动，以下是编码的函数：

```python
def sms_send(sms_api_appcode, sms_api_appskin, phone, message):
    sms_api_url_pre = 'http://dingxin.market.alicloudapi.com'
    sms_api_url_path = '/dx/sendSms'
    sms_api_params = {
        "param": message,
        "mobile": phone,
        "tpl_id": sms_api_appskin,
    }
    sms_api_url = sms_api_url_pre + sms_api_url_path

    sms_api_en_params = urlencode(sms_api_params)
    sms_api_header = { 'Authorization' : 'APPCODE ' + sms_api_appcode}

    sms_api_request = Request(sms_api_url,sms_api_en_params,sms_api_header)
    sms_api_response = urlopen(sms_api_request)
    sms_api_content = sms_api_response.read()
    sms_return_data = json.loads(sms_api_content)
    #print sms_return_data
    if sms_return_data:
        error_code = sms_return_data["return_code"]
        if error_code == "00000":
            print "SMS is sent successfully"
        else:
            print sms_return_data["order_id"]
    else:
        print "request sms api error"
```

注意以上代码中采用了`APPCODE`的方式来鉴权有效性，使用了添加`header`的方式

### 3.整体逻辑和定时执行

上面完成了主题逻辑的设计，就差最后组装到一起了：

```python
def main():
    try:

        football_api_appkey = ""

        sms_api_appcode = ''
        sms_api_appskin = 0001

        football_club = ""
        phone = 1234567890

        message = club_match_query(football_api_appkey, football_club).encode('utf-8')
        if message != "no recent match":
            sms_send(sms_api_appcode, sms_api_appskin, phone, message)
        else:
            print "no recent match"

    except Exception, e:
        print 'str(Exception):\t', str(Exception)
        print  'str(e):\t\t', str(e)
        print 'repr(e):\t', repr(e)
        print 'e.message:\t', e.message
        print 'traceback.print_exc():', traceback.print_exc()
        print 'traceback.format_exc():\n%s' % traceback.format_exc()
```

这里添加了错误处理，方便有错误时debug，APPCODE等置空参数需要用户自行填写 那么最后就是对这个脚本进行定时执行，在这里我采用了Linux环境下常用的定时工作管理命令crontab，限于篇幅不过多赘述，在这里编写了bash脚本负责自动写入系统crontab：

```bash
#!/bin/bash
echo "/usr/bin/python "$PWD"/soccer_dog_reminder.py" > ./soccer_dog_reminder.sh
chmod a+x ./soccer_dog_reminder.sh
chmod a+x ./soccer_dog_reminder.py
echo "30 19 * * * "sh $PWD"/soccer_dog_reminder.sh > "$PWD"/cron.log" >> ./cron
echo "30 8 * * * "sh $PWD"/soccer_dog_reminder.sh > "$PWD"/cron.log" >> ./cron
crontab cron
rm cron
```

在这里呢有一个坑要和大家分享：`crontab`里是没有默认bash的环境变量的，所以所有的命令和文件都是必须写**绝对路径**，并且调用Python脚本最好吧脚本写入Bash Script文件，在统一用bash脚本调用 每天早上8：30和晚上19:30两次提醒，这下不会忘记比赛了吧～

## 遇到的问题 troubleshoot

### Linux的中文编码问题

由于要发送中文短信，所以我特意选用了中文的足球赛事API，那么问题就来了，有的系统不支持中文显示，也就是说不支持中文的字符集，所以会出现字符编码的错误`UnicodeEncodeError: 'ascii' codec can't encode characters in position 0-1: ordinal not in range(128)`，于是我们首先为系统安装中文编码： 打开终端或者SSH，修改： /etc/default/locale /etc/environment crontab -e

```bash
LANG="zh_CN.UTF-8"
LANGUAGE="zh_CN:zh:en_US:en"
LC_ALL="zh_CN.utf-8"
```

将上述内容加入或覆盖到以上配置文件中，然后在终端中输入`locale-gen`，重启终端或者重新重新登录SSH会发现在终端中运行脚本不会再有错误，中文也能正常显示

### Python解释器的默认编码

当我美滋滋的完成了以上配置原本以为完事大吉的时候，当我看到`crontab`执行的结果的时候内心是崩溃的在`crontab`的输出Log上我有一次看到了`UnicodeEncodeError: 'ascii' codec can't encode characters in position 0-1: ordinal not in range(128)`，经过疯狂的查阅资料，我猜测是crontab里的运行环境和普通终端不一致，所以导致了Python解释器的默认编码缺省（也即是默认的ascii） 查看当前解释器默认字符串编码格式：

```python
import sys
sys.getdefaultencoding()
```

果然不出所料是ascii，所以我们要在Python脚本中进行重新定义，使其切换成zh_CN.utf-8

```python
import sys
reload(sys)
sys.setdefaultencoding('utf-8')
```

如此再用`crontab`就成功的执行了！

## 后记

如果你喜欢这个项目或者有需求，欢迎自己亲自搭建一下这个小脚本 [soccer_dog_reminder](https://github.com/hackerchai/soccer_dog_reminder/)，别忘了给我一个**Star**。当然如果你想完善这个项目，欢迎给我提交 Pull Requst！ 现在自从有了这个小脚本，妈妈再也不用担心我错过球赛啦～ Forca Barca！
