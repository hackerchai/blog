---
title: Rust下成熟好用的权限控制库
author: Eason Chai
pubDatetime: 2020-09-18T13:24:36+08:00
tags:
  - rust
  - casbin
  - authz
  - acl
postSlug: rust-acl-casbin
draft: false
featured: true
description: Casbin-RS权限控制库生态介绍
---

export const prerender = true;

## Table of contents

# 什么是[Casbin-rs](https://github.com/casbin/casbin-rs)

[Casbin](https://github.com/casbin/casbin)是罗杨博士主导开发的基于 Go 语言的权限控制库。它支持 ACL, RBAC, ABAC 等常用的访问控制模型。

[Casbin-rs](https://github.com/casbin/casbin-rs)则是 Rust 语言下的移植， 相比 Go 语言版本有更高的速度和内存安全保障。

# Casbin 做了什么

1. Casbin 的配置文件由两部分组成， 一个是 Configuration 文件（可以理解为模型配置文件）， 配置了模型（ Model ）选用，分组（ Group ）配置，定义请求（ Request ）和策略（ Policy ）结构，再有就是匹配器（ Matcher ）的配置，这些在后文由叙述。另外一个就是策略（ Policy ）的盛放容器， 这个可以是 csv 文件，也可以是数据库（ MySQL/PostgreSQl ）。容器中的 Policies 都衍生于 Model 的配置
2. 支持 RBAC 中的多层角色继承，不止主体可以有角色，资源也可以具有角色
3. 支持超级用户，如 root 或 Administrator，超级用户可以不受授权策略的约束访问任意资源
4. 支持多种内置的操作符，如 keyMatch，方便对路径式的资源进行管理，如 /book/1 可以映射到 /book/:id

# Casbin 不做什么

1. 身份认证 authentication(即验证用户的用户名、密码)，casbin 只负责访问控制。应该有其他专门的组件负责身份认证，然后由 casbin 进行访问控制，二者是相互配合的关系。
2. 管理用户列表或角色列表。Casbin 认为由项目自身来管理用户、角色列表更为合适，用户通常有他们的密码，但是 Casbin 的设计思想并不是把 它作为一个存储密码的容器。而是存储 RBAC 方案中用户和角色之间的映射关系。

# 一个例子

## 模型配置

```bash
// model.conf
# Request definition
[request_definition]
r = sub, obj, act

# Policy definition
[policy_definition]
p = sub, obj, act

# Policy effect
[policy_effect]
e = some(where (p.eft == allow))

# Matchers
[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
```

这是一个模型定义文件， 其中`sub`代表访问资源的用户， `obj`表示要访问的资源， `act`表示对资源执行的操作。如果在 Web 的情形中，可以理解为，sub 对应用户名，obj 对应访问的 URL Path，act 代表 HTTP 动作(GET/POST/PUT).

在这里，Request Definition 告诉我们请求是什么构成，一共三个。Policy Defination 有什么构成，和前面的同理。Policy Effect 告诉我们什么时候规则是有效的，而 Matcher 告诉我们当请求和策略满足一定关系才可以返回真（允许操作）。如上，意思就很明白。

如果我们要加入一个超级管理员，它可以执行任何操作，可以这样写：

```bash
[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act || r.sub == "root"
```

## 策略配置

```bash
p, alice, data1, read
p, bob, data2, write
```

上述的配合上文的模型配置表达的意思就是，alice 可以读 data1，bob 可以写 data2

# Casbin Rust 生态

主仓库:

[Casbin-RS](https://github.com/casbin/casbin-rs/): 目前支持所有 Casbin Go 版本支持的特性，正在活跃开发中

目前 Casbin Rust 正稳步发展中，目前支持的组件有：

- [Casbin Diesel Adaper](https://github.com/casbin-rs/diesel-adapter): 使用 Rust 目前最火的 ORM 类库开发的适配器，支持 MySQL/PostgreSQL/SQLite
- [Casbin Actix-web Middleware](https://github.com/hackerchai/actix-casbin-auth): Rust 最由名气的 Web 框架当属 Actix-web，性能霸榜。Casbin 支持 Actix 中间件,自动为请求进行权限管理
- [Casbin Actix-web Actor](https://github.com/hackerchai/actix-casbin): Actix 框架下对 Casbin 进行二次封装，方便在 Actix-web 中使用，封装了常用函数
- [Casbin Sqlx Adapter](https://github.com/casbin-rs/sqlx-adapter): 支持完全异步的数据库中间件，性能更好，基于 Sqlx 。支持 MySQL/PostgreSQL

基于 Actix-web 开发，使用 Casbin 中间件鉴权， 使用 JWT 用户授权的例子：

- [Casbin Actix-web Real World App](https://github.com/casbin-rs/examples/tree/master/actix-middleware-example)

此外 Casbin 拥有强大的文档支持和社区依托：

- [Casbin 官网](https://casbin.org) [Casbin 文档](https://casbin.org/docs/en/overview)
- [Casbin 论坛](https://forum.casbin.org)
- Casbin 同时支持除了 Go，Rust 以外六种语言：Node.js, PHP, Python, C#(.NET), C++, Java

**最后希望各位看官走过路过，别忘了给一个 Star 支持一下我们的开发**

文章同步发于[Hackerchai Rust Blog - Rust下成熟好用的权限控制库](https://blog.starcys.xyz/rust-acl-casbin)
