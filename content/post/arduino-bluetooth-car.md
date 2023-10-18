---
title: Arduino智能蓝牙小车Dev1完工
tags:
  - Arduino
categories:
  - Arduino
date: 2014-09-26 12:03:56
gitmentId: /arduino-bluetooth-car/
aliases: 
  - /arduino-bluetooth-car
toc: true
draft: false
description: 用Arduino和Motor Shield制作蓝牙小车，使用了安卓手机蓝牙遥控
---

经过三天的努力，终于把Arduino蓝牙小车完工了。整个制作过程挺艰难，又要躲过学校老师的围追堵截，又要高效的完成各个工作。这是我加入东北育才学校机器人实验室之后的第一个作品。在龚鹏老师的帮助下，我完成了整个制作。整个小车的原理很简单，利用Arduino的串口TXD，RXD和蓝牙模块通信，然后通过motor shield来驱动直流减速电机。看起来挺容易，但对于我在这种第一次使用蓝牙模块的人，还是蛮困难的。准备的材料如下： 1.ardino uno 2.L298N 直流电机驱动板 3.直流减速电机 两个 4.智能小车专用底盘（包含轮子）**可以自行淘宝搜索下** 5.杜邦线若干 6.蓝牙模块（XM-15B)

*   Github开源仓库地址 [hackerchai/arduino-bluetooth-car](https://github.com/hackerchai/arduino-bluetooth-car)

附上代码：

```C
int PWMA=5;
int PWMB=6;
int INA=4;
int INB=7;


void setup()
{
  Serial.begin(9600);
  pinMode(PWMA,OUTPUT);
  pinMode(PWMB,OUTPUT);
  pinMode(INA,OUTPUT);
  pinMode(INB,OUTPUT);  
}
void forward()
{
  digitalWrite(INA,HIGH);
  digitalWrite(INB,HIGH);
  analogWrite(PWMA,500);
  analogWrite(PWMB,500);

}
void back()
{
  digitalWrite(INA,LOW);
  digitalWrite(INB,LOW);
  analogWrite(PWMA,500);
  analogWrite(PWMB,500);

}
void tleft()
{
  digitalWrite(INA,LOW);
  digitalWrite(INB,HIGH);
  analogWrite(PWMA,200);
  analogWrite(PWMB,200);

}
void tright()
{
  digitalWrite(INA,HIGH);
  digitalWrite(INB,LOW);
  analogWrite(PWMA,200);
  analogWrite(PWMB,200);
}
void left()
{
  digitalWrite(INA,LOW);
  digitalWrite(INB,HIGH);
  analogWrite(PWMA,200);
  analogWrite(PWMB,200);
  delay(400);
  off();


}
void right()
{
  digitalWrite(INA,HIGH);
  digitalWrite(INB,LOW);
  analogWrite(PWMA,200);
  analogWrite(PWMB,200);
  delay(400);
  off();

  

}
void off()
{
  analogWrite(PWMA,0);
  analogWrite(PWMB,0);

}
void loop()
{
  while(Serial.available())
   {
     char c=Serial.read();
      switch(c)
      {
        case 'g':
        {
         forward();
         break;
        }
        case 'l':
        {
          tleft();
          break;
        }
        case 'r':
        {
          tright();
          break;
        }
        case 'b':
        {
          back();
          break;
        }
        case 't':
        {
          off();
          break;
        }
        case 'e':
        {
          left();
          break;
        }
        case 'i':
        {
          right();
          break;
        }
      }
         
        
   }
}

后来发现前进不好控制，于是修改下：

int PWMA=5;
int PWMB=6;
int INA=4;
int INB=7;


void setup()
{
  Serial.begin(9600);
  pinMode(PWMA,OUTPUT);
  pinMode(PWMB,OUTPUT);
  pinMode(INA,OUTPUT);
  pinMode(INB,OUTPUT);  
}
void forward()
{
  digitalWrite(INA,HIGH);
  digitalWrite(INB,HIGH);
  analogWrite(PWMA,500);
  analogWrite(PWMB,500);
  delay(500);
  off();
}
void back()
{
  digitalWrite(INA,LOW);
  digitalWrite(INB,LOW);
  analogWrite(PWMA,500);
  analogWrite(PWMB,500);
  delay(500);
  off();
}

void tforward()
{
  digitalWrite(INA,HIGH);
  digitalWrite(INB,HIGH);
  analogWrite(PWMA,500);
  analogWrite(PWMB,500);

}
void tback()
{
  digitalWrite(INA,LOW);
  digitalWrite(INB,LOW);
  analogWrite(PWMA,500);
  analogWrite(PWMB,500);

}
void tleft()
{
  digitalWrite(INA,LOW);
  digitalWrite(INB,HIGH);
  analogWrite(PWMA,200);
  analogWrite(PWMB,200);

}
void tright()
{
  digitalWrite(INA,HIGH);
  digitalWrite(INB,LOW);
  analogWrite(PWMA,200);
  analogWrite(PWMB,200);
}
void left()
{
  digitalWrite(INA,LOW);
  digitalWrite(INB,HIGH);
  analogWrite(PWMA,200);
  analogWrite(PWMB,200);
  delay(400);
  off();


}
void right()
{
  digitalWrite(INA,HIGH);
  digitalWrite(INB,LOW);
  analogWrite(PWMA,200);
  analogWrite(PWMB,200);
  delay(400);
  off();

  

}
void off()
{
  analogWrite(PWMA,0);
  analogWrite(PWMB,0);

}
void loop()
{
  while(Serial.available())
   {
     char c=Serial.read();
      switch(c)
      {
        case 'g':
        {
         forward();
         break;
        }
        case 'o':
        {
          tforward();
          break;
        }
        case 'l':
        {
          tleft();
          break;
        }
        case 'r':
        {
          tright();
          break;
        }
        case 'b':
        {
          tback();
          break;
        }
        case 't':
        {
          off();
          break;
        }
        case 'e':
        {
          left();
          break;
        }
        case 'i':
        {
          right();
          break;
        }
      }
         
        
   }
}
```

完工照片 
![bluetooth-aiduino-car](https://blog.cdn.hackerchai.com/images/2014/09/bluetooth-aiduino-car.webp) 

附上视频： [http://youku.tv/BJQEyU](http://youku.tv/BJQEyU)