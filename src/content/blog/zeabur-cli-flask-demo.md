---
title: 如何使用 Zeabur CLI 部署一个简单 Flask 应用
author: Eason Chai
tags:
  - PaaS
  - Zeabur
  - k8s
  - CLI
  - Golang
  - Flask
  - Python
  - Intern

pubDatetime: 2023-02-06T17:17:30Z
slug: zeabur-cli-flask-demo
draft: false
featured: true
description: 这篇文章将会指引你在 10 分钟内，使用 Zeabur CLI 完成一个从零开始的 Flask 后端应用搭建并部署到 Zeabur
---

## Table of contents

# 如何使用 Zeabur CLI 部署一个简单 Flask 应用

### 介绍

这篇文章将会指引你在 10 分钟内，使用 [Zeabur CLI](https://github.com/zeabur/cli) 完成一个从零开始的 Flask 后端应用搭建并部署到 [Zeabur](https://zeabur.com)

### 什么是 Zeabur CLI

[Zeabur CLI](https://github.com/zeabur/cli) 提供了命令行对于 [Zeabur Dashboard](https://dash.zeabur.com) 的操作，使得开发者可以不离开终端快速的为应用提供一键部署服务。只需要敲几行命令，应用就可以在云端运行并且配置好域名以供访问。

关于 [Zeabur CLI](https://github.com/zeabur/cli) 的技术细节可以参考 [这篇文章](https://zeabur.com/blogs/zeabur-cli) 。

### 使用 Zeabur CLI 部署一个简单 Flask + MySQL 应用

##### 步骤一：安装 Zeabur CLI

可以参考 [Install Zeabur CLI](https://github.com/zeabur/cli?tab=readme-ov-file#1-install) 根据操作系统安装

以 MacOS 平台为例，在命令行执行以下命令完成安装：

```bash
brew install zeabur/tap/cli
```

##### 步骤二：准备代码环境

在这里我们使用 [Flask](https://github.com/pallets/flask) 和 [MySQL](https://www.mysql.com/) 来构建后端应用。

1. 首先使用 [venv](https://github.com/pypa/virtualenv) 创建虚拟 Python 环境用来开发调试，接下来安装相关依赖，这里我们使用 [flask_sqlachemy](https://flask-sqlalchemy.palletsprojects.com/en/3.1.x/) 作为 ORM 框架来操作 MySQL：

   ```bash
   mkdir zeabur-cli-flask-demo
   cd zeabur-cli-flask-demo
   python -m venv myenv
   source myenv/bin/activate
   pip install flask Flask-SQLAlchemy
   ```

   ![setup-environment](https://blog.cdn.hackerchai.com/images/2024/02/setup-environment.png)

2. 由于需要连接 [MySQL](https://www.mysql.com/) ， 还需要安装 [mysqlclient](https://github.com/PyMySQL/mysqlclient) 依赖，可以参考[这篇文档](https://github.com/PyMySQL/mysqlclient/blob/main/README.md)，根据操作系统安装。

3. 在目录根创建 `app.py` 文件，这是 flask 应用的主入口文件：

   ```python
   from flask import Flask, request, current_app
   from flask_sqlalchemy import SQLAlchemy
   import os
   import logging

   app = Flask(__name__)
   db_url = os.environ.get('DATABASE_URL')
   app.config['SQLALCHEMY_DATABASE_URI'] = db_url or 'mysql://username:password@localhost/db_name'
   db = SQLAlchemy(app)

   class Task(db.Model):
       id = db.Column(db.Integer, primary_key=True)
       content = db.Column(db.String(80), nullable=False)

   @app.route('/tasks', methods=['POST'])
   def add_task():
       content = request.json['content']
       task = Task(content=content)
       db.session.add(task)
       db.session.commit()
       return {'id': task.id}

   @app.route('/tasks', methods=['GET'])
   def get_tasks():
       tasks = Task.query.all()
       return {'tasks': [{'id': task.id, 'content': task.content} for task in tasks]}

   @app.route('/tasks/<int:id>', methods=['DELETE'])
   def delete_task(id):
       task = Task.query.get(id)
       if task:
           db.session.delete(task)
           db.session.commit()
           return {'result': 'success'}
       return {'result': 'error', 'message': 'Task not found'}, 404

   with app.app_context():
       db.create_all()

   if __name__ == '__main__':
       app.run(debug=True, port=os.getenv("PORT", default=5000), host='0.0.0.0')
   ```

   在上述代码中，完成了一个简单的 TodoList 应用，使用 REST API 完成了对于任务的增加/删除/查询，通过读取环境变量 `DATABASE_URL` ，获取连接 MySQL 的机要信息，flask web server 启动在 `0.0.0.0` ，端口通过环境变量 `PORT` 获取。

##### 步骤三：部署 MySQL 服务

一般情况后端应用开发都需要测试数据库服务器，以往的办法诸如本地运行/ Docker 部署都相对繁琐，Zeabur 提供了全新的快速部署数据库服务的方式：

1. 使用 [Zeabur CLI](https://github.com/zeabur/cli) ，在终端中输入以创建项目:

   ```bash
   zeabur project create zeabur-cli-flask-demo
   ```

   ![create-project](https://blog.cdn.hackerchai.com/images/2024/02/create-project.png)

2. 创建 MySQL Prebuilt Serivice:

   ```bash
   zeabur service deploy
   ```

   在选择框中选择 `Prebuilt` 类型，在接下来的选择框中选择 `MySQL` 类型：

   ![mysql-service-deploy-select](https://blog.cdn.hackerchai.com/images/2024/02/mysql-service-deploy-select.png)

   创建后我们可以查看 Project 中的 Service 列表, 在终端输入 `zeabur service list` 即可看到刚才创建的服务：

   ![service-list](https://blog.cdn.hackerchai.com/images/2024/02/service-list.png)

3. 获取连接信息,在终端输入并选择刚才建立的 `MySQL` Service：

   ```bash
   zeabur service instruction
   ```

   我们将这些信息记下,以备后续的步骤使用公网连接数据库：

   ![service-instruction](https://blog.cdn.hackerchai.com/images/2024/02/service-instruction.png)

4. 使用上述的信息，启动 flask 应用以本地测试，在终端中输入:

   ```bash
   DATABASE_URL=mysql://root:<MYSQL_PASSWORD>@sfo1.clusters.zeabur.com:<MYSQL_PORT>/zeabur python ./app.py
   ```

   ![run-flask-local](https://blog.cdn.hackerchai.com/images/2024/02/run-flask-local.png)

   运行成功后，可以使用 [Postman](https://www.postman.com/) 或者 [Paw](https://paw.cloud/) 等调试工具来测试 API：

   ![run-flask-local-success](https://blog.cdn.hackerchai.com/images/2024/02/run-flask-local-success.png)

##### 步骤四：部署后端 Flask 应用

1. [Zeabur CLI](https://github.com/zeabur/cli) 提供了便捷的一键部署本地代码到 Zeabur 的命令，只需在应用目录下敲 `zeabur` ，CLI 会自动上传您的代码并进行部署

   ![zeabur-deploy](https://blog.cdn.hackerchai.com/images/2024/02/zeabur-deploy.png)

2. 为了应用能够正常运行，我们仍需创建环境变量以连接数据库, 由于在 flask 服务和 MySQL 服务在同一个 Project 下，我们可以利用 [Private Networking](https://zeabur.com/docs/zh-CN/deploy/private-networking) 更高效的连接数据库：

   查看 MySQL 服务的 `network` 信息，在终端输入 `zeabur service network` 并选中相应服务：

   ![service-network](https://blog.cdn.hackerchai.com/images/2024/02/service-network.png)

   根据上述域名，我们以此创建 flask 应用的 环境变量，在终端中输入 `zeabur variable create` ：

   ```bash
   DATABASE_URL=mysql://${MYSQL_USERNAME}:${MYSQL_PASSWORD}@mysql.zeabur.internal:${MYSQL_PORT}/${MYSQL_DATABASE}
   PORT=8080
   ```

   ![variable-create-advance](https://blog.cdn.hackerchai.com/images/2024/02/variable-create-advance.png)

   上述环境变量 `MYSQL_USERNAME` 、 `MYSQL_PASSWORD` 、 `MYSQL_PORT` 、`MYSQL_DATABASE` 都是系统自动生成注入，免去了手动填写的麻烦。 `PORT` 环境变量使得 Zeabur 可以自动识别 web 端口并且自动绑定公网访问。

   为了服务可以应用环境变量，我们应当重启服务，终端输入 `zeabur service restart`:

   ![service-restart](https://blog.cdn.hackerchai.com/images/2024/02/service-restart.png)

3. 为了在公网访问 web 服务，我们还需要绑定一个域名。这里我们使用 `*.zeabur.app` 自动生成域名为例子，在终端输入 `zeabur domain create` ：

   ![domain-create](https://blog.cdn.hackerchai.com/images/2024/02/domain-create.png)

至此，我们已经完成了全部的步骤，此时我们可以使用 [Postman](https://www.postman.com/) 或者 [Paw](https://paw.cloud/) 等调试工具来验证部署：

![deploy-zeabur-success](https://blog.cdn.hackerchai.com/images/2024/02/deploy-zeabur-success.png)

### 总结

使用 [Zeabur CLI](https://github.com/zeabur/cli) 部署后端应用是一个快捷舒适的流程，可以大幅度提高您敏捷开发的效率，使得无论是测试还是生产部署都变得非常便捷。
