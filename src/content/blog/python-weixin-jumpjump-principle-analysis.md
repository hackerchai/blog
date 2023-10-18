---
title: Python微信跳一跳辅助原理解析
author: Eason Chai
tags:
  - ADB
  - PIL
  - python
  - 图像识别
  - 微信跳一跳
  - 游戏外挂
  - 游戏辅助
pubDatetime: 2018-01-05T18:50:26Z
postSlug: python-weixin-jumpjump-principle-analysis
toc: true
featured: false
description: 目前爆红的微信小游戏，讲解了其Python外挂的实现机制和代码解析
---

# 微信跳一跳

2017 年 12 月 28 日下午，微信发布了 6.6.1 版本，加入了「小游戏」功能，并提供了官方 DEMO「跳一跳」。这是一个 2.5D 插画风格的益智游戏，玩家可以通过按压屏幕时间的长短来控制这个「小人」跳跃的距离。分数越高，那么在好友排行榜更加靠前。
![介绍](https://blog.cdn.hackerchai.com/images/2018/01/weixin-jumpjump-intro.webp)

# 辅助脚本

[wechat_jump_game](https://github.com/wangshub/wechat_jump_game)是一个python2编写的辅助外挂。通过Python的图片操作库分析手机实时的截图，通过图像识别获取棋子位置和棋盘的位置，从而通过ADB模拟点击操作完成自动操作。 https://v.qq.com/x/page/j0542oocazn.html

# 辅助工作原理

- 将手机点击到《跳一跳》小程序界面
- 用 ADB 工具获取当前手机截图，并用 ADB 将截图 pull 上来

```bash
    adb shell screencap -p /sdcard/autojump.webp
    adb pull /sdcard/autojump.webp .
```

计算按压时间

- 手动版：用 Matplotlib 显示截图，用鼠标先点击起始点位置，然后点击目标位置，计算像素距离；
- 自动版：靠棋子的颜色来 识别棋子，靠底色和方块的色差来识别棋盘；

- 用 ADB 工具点击屏幕蓄力一跳

```bash
    adb shell input swipe x y x y time(ms)
```

# 思路以及代码分析

核心：我们这次讲解以最常用最好用的自动脚本为例。每次落稳之后截图，根据截图算出棋子的坐标和下一个块顶面的中点坐标，根据两个点的距离乘以一个时间系数获得长按的时间 1.首先脚本会检测ADB的可用性，并获取当前手机型号，分辨率等信息。

- 获取手机分辨率

```python
def _get_screen_size():
    '''
    获取手机屏幕大小
    '''
    size_str = os.popen('adb shell wm size').read()
    if not size_str:
        print('请安装 ADB 及驱动并配置环境变量')
        sys.exit()
    m = re.search(r'(\\d+)x(\\d+)', size_str)
    if m:
        return "{height}x{width}".format(height=m.group(2), width=m.group(1))
    return "1920x1080"

```

注意re.serarch是正则表达式操作，目的是从ADB输出中提取出屏幕分辨率的两个数字。

- 调用配置文件

```python
def open_accordant_config():
    '''
    调用配置文件
    '''
    screen_size = _get_screen_size()
    config_file = "{path}/config/{screen_size}/config.json".format(
        path=sys.path[0],
        screen_size=screen_size
    )
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            print("Load config file from {}".format(config_file))
            return json.load(f)
    else:
        with open('{}/config/default.json'.format(sys.path[0]), 'r') as f:
            print("Load default config")
            return json.load(f)
```

这段函数实际的操作是通过获取的屏幕大小获取之前已经调试好的数据，包括根据屏幕大小测算好的二分之一的棋子底座高度，棋子的宽度，长按的时间系数（后文会继续说明）等等。 2.截图以及从手机拉取到PC

```python
if screenshot_way == 2 or screenshot_way == 1:
        process = subprocess.Popen('adb shell screencap -p', shell=True, stdout=subprocess.PIPE)
        screenshot = process.stdout.read()
        if screenshot_way == 2:
            binary_screenshot = screenshot.replace(b'\r\n', b'\n')
        else:
            binary_screenshot = screenshot.replace(b'\r\r\n', b'\n')
        f = open('autojump.webp', 'wb')
        f.write(binary_screenshot)
        f.close()
```

3.关键步骤：寻找棋子坐标和下一跳棋盘坐标

- 识别棋子：靠棋子的颜色来识别位置，通过截图发现最下面一行大概是一条直线，就从上往下一行一行遍历，比较颜色（颜色用了一个区间来比较）找到最下面的那一行的所有点，然后求个中点，求好之后再让 Y 轴坐标减小棋子底盘的一半高度从而得到中心点的坐标
  ![](https://blog.cdn.hackerchai.com/images/2018/01/weixin-jumpjump-piece.webp)

这段代码的核心是Python的PIL库操作，如果不了解请自行Google学习。

```python
def find_piece_and_board(im):
    '''
    寻找关键坐标
    '''
    w, h = im.size

    piece_x_sum = 0
    piece_x_c = 0
    piece_y_max = 0
    board_x = 0
    board_y = 0
    scan_x_border = int(w / 8)  # 扫描棋子时的左右边界
    scan_start_y = 0  # 扫描的起始 y 坐标
    im_pixel = im.load()
    # 以 50px 步长，尝试探测 scan_start_y
    for i in range(int(h / 3), int(h*2 / 3), 50):
        last_pixel = im_pixel[0, i]
        for j in range(1, w):
            pixel = im_pixel[j, i]
            # 不是纯色的线，则记录 scan_start_y 的值，准备跳出循环
            if pixel[0] != last_pixel[0] or pixel[1] != last_pixel[1] or pixel[2] != last_pixel[2]:
                scan_start_y = i - 50
                break
        if scan_start_y:
            break
    print('scan_start_y: {}'.format(scan_start_y))

    # 从 scan_start_y 开始往下扫描，棋子应位于屏幕上半部分，这里暂定不超过 2/3
    for i in range(scan_start_y, int(h * 2 / 3)):
        for j in range(scan_x_border, w - scan_x_border):  # 横坐标方面也减少了一部分扫描开销
            pixel = im_pixel[j, i]
            # 根据棋子的最低行的颜色判断，找最后一行那些点的平均值，这个颜色这样应该 OK，暂时不提出来
            if (50 < pixel[0] < 60) and (53 < pixel[1] < 63) and (95 < pixel[2] < 110):
                piece_x_sum += j
                piece_x_c += 1
                piece_y_max = max(i, piece_y_max)

    if not all((piece_x_sum, piece_x_c)):
        return 0, 0, 0, 0
    piece_x = int(piece_x_sum / piece_x_c)
    piece_y = piece_y_max - piece_base_height_1_2  # 上移棋子底盘高度的一半
```

这段代码开始搜寻棋子底端近似一条直线的特征，通过一个近似的RGB颜色区域来判断是否是棋子，当程序搜寻到最后一行的时候，计算这一行所都X坐标的平均值记做中点X值，然后将Y坐标向上移动一半棋子底盘高度的值，也就是定位到棋子底面中心，以此确定最终棋子的确切位置

- 识别棋盘

```python
if piece_x < w/2:
        board_x_start = piece_x
        board_x_end = w
    else:
        board_x_start = 0
        board_x_end = piece_x
```

上述代表根据棋子坐标确定下一跳棋盘的开始结束坐标

```python
   for i in range(int(h / 3), int(h * 2 / 3)):
        last_pixel = im_pixel[0, i]
        if board_x or board_y:
            break
        board_x_sum = 0
        board_x_c = 0

        for j in range(int(board_x_start), int(board_x_end)):
            pixel = im_pixel[j, i]
            # 修掉脑袋比下一个小格子还高的情况的 bug
            if abs(j - piece_x) < piece_body_width:
                continue

            # 修掉圆顶的时候一条线导致的小 bug，这个颜色判断应该 OK，暂时不提出来
            if abs(pixel[0] - last_pixel[0]) + abs(pixel[1] - last_pixel[1]) + abs(pixel[2] - last_pixel[2]) > 10:
                board_x_sum += j
                board_x_c += 1
        if board_x_sum:
            board_x = board_x_sum / board_x_c
    last_pixel = im_pixel[board_x, i]

    # 从上顶点往下 +274 的位置开始向上找颜色与上顶点一样的点，为下顶点
    # 该方法对所有纯色平面和部分非纯色平面有效，对高尔夫草坪面、木纹桌面、药瓶和非菱形的碟机（好像是）会判断错误
    for k in range(i+274, i, -1): # 274 取开局时最大的方块的上下顶点距离
        pixel = im_pixel[board_x, k]
        if abs(pixel[0] - last_pixel[0]) + abs(pixel[1] - last_pixel[1]) + abs(pixel[2] - last_pixel[2]) < 10:
            break
    board_y = int((i+k) / 2)

    # 如果上一跳命中中间，则下个目标中心会出现 r245 g245 b245 的点，利用这个属性弥补上一段代码可能存在的判断错误
    # 若上一跳由于某种原因没有跳到正中间，而下一跳恰好有无法正确识别花纹，则有可能游戏失败，由于花纹面积通常比较大，失败概率较低
    for l in range(i, i+200):
        pixel = im_pixel[board_x, l]
        if abs(pixel[0] - 245) + abs(pixel[1] - 245) + abs(pixel[2] - 245) == 0:
            board_y = l+10
            break

    if not all((board_x, board_y)):
        return 0, 0, 0, 0

    return piece_x, piece_y, board_x, board_y
```

这时候从边界最上方一行一行扫描，由于圆形的块最顶上是一条线，方形的上面大概是一个点，所以就用类似识别棋子的做法多识别了几个点求中点，这时候得到了块中点的 X 轴坐标，这时候假设现在棋子在当前块的中心，从上顶点往下 +274 的位置开始向上找颜色与上顶点一样的点，为下顶点，取两者平均则是棋盘上平面中心点Y坐标。另外，如果上一跳命中中间，则下个目标中心会出现 r245 g245 b245 的白点，寻找这个白点可以直接找到棋盘上平面的中心点Y坐标 中心点如图：
![](https://blog.cdn.hackerchai.com/images/2018/01/weixin-jumpjump-board-point.webp)

274像素的寻找方式：
![](https://blog.cdn.hackerchai.com/images/2018/01/weixin-jumpjump-pixel-find.webp)

4.测算两点距离和点按时间确定

- 两点距离计算 距离的求法很简单，和初中直角坐标系下两点距离公式一致：
  ![](https://blog.cdn.hackerchai.com/images/2018/01/weixin-jumpjump-distance.webp)

![](https://blog.cdn.hackerchai.com/images/2018/01/weixin-jumpjump-distance-summary.webp)

```python
math.sqrt((board_x - piece_x) ** 2 + (board_y - piece_y) ** 2)
```

- 通过距离推算按压时间

```python
def jump(distance):
    '''
    跳跃一定的距离
    '''
    press_time = distance * press_coefficient
    press_time = max(press_time, 200)   # 设置 200ms 是最小的按压时间
    press_time = int(press_time)
```

上述代码提及了press_coefficient也就是上文提到的**长按的时间系数**，这个量与屏幕大小有关，作者通过大量的调试数据为我们提供了这个比例系数，在脚本初始化时，脚本会根据屏幕分辨率（个别手机需要单独考虑）来读取各自的config文件，获取这个系数，下面是1080\*1920分辨率屏幕的config文件：

```json
{
  "under_game_score_y": 300,
  "press_coefficient": 1.392,
  "piece_base_height_1_2": 20,
  "piece_body_width": 70,
  "swipe": {
    "x1": 500,
    "y1": 1600,
    "x2": 500,
    "y2": 1602
  }
}
```

从github里这么多分辨率的适配config可以看出，这不是一个人的工作，包括一些特殊机型的适配文件，这些都是Github上众多开发者共同协作的结果，这就是开源精神。\_

- 通过ADB模拟点按操作

其本质是通过adb命令，给手机模拟按压事件

```bash
adb shell input swipe x y x y time
```

其中 x 和 y 是屏幕坐标， time 是触摸时间，单位ms。在代码中可以参见jump()函数。以上就完成了一次完整的操作。 5.整体循环逻辑和防和谐

```python
while True:
        pull_screenshot()
        im = Image.open('./autojump.webp')
        # 获取棋子和 board 的位置
        piece_x, piece_y, board_x, board_y = find_piece_and_board(im)
        ts = int(time.time())
        print(ts, piece_x, piece_y, board_x, board_y)
        set_button_position(im)
        jump(math.sqrt((board_x - piece_x) ** 2 + (board_y - piece_y) ** 2))
        if debug_switch:
            debug.save_debug_screenshot(ts, im, piece_x, piece_y, board_x, board_y)
            debug.backup_screenshot(ts)
        i += 1
        if i == next_rest:
            print('已经连续打了 {} 下，休息 {}s'.format(i, next_rest_time))
            for j in range(next_rest_time):
                sys.stdout.write('\r程序将在 {}s 后继续'.format(next_rest_time - j))
                sys.stdout.flush()
                time.sleep(1)
            print('\n继续')
            i, next_rest, next_rest_time = 0, random.randrange(30, 100), random.randrange(10, 60)
        time.sleep(random.uniform(0.9, 1.2))   # 为了保证截图的时候应落稳了，多延迟一会儿，随机值防 ban
```

以上是完整的主函数循环逻辑，其中还为了防止微信官方屏蔽特意加入了“喘息时间”的机制，即一定步数之后休眠一定时间，还是很机智的呀。

# 仍然存在的问题

由于实现的方法还存在漏洞，程序还存在以下问题： 1.该算法对所有纯色平面和部分非纯色平面有效，对高尔夫草坪面、木纹桌面、药瓶和非菱形的碟机（好像是）会判断错误，若上一跳由于某种原因没有跳到正中间，而下一跳恰好有无法正确识别花纹，则有可能游戏失败，由于花纹面积通常比较大，失败概率较低 2.还没有智能识别唱片机等加分物件。

# 总结

此辅助是一个很具有趣味性的Python小程序，可以作为研究Python PIL编程和简单图片识别入门的小项目。有兴趣的话还可以做一些优化给作者pull request啊~
