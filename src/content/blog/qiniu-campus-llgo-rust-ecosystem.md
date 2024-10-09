---
title: LLGo Rust 生态探索和七牛云 1024 实训营
author: Eason Chai
tags:
  - Golang
  - Rust
  - FFI
  - llvm
  - PL
  - async
  - Intern
pubDatetime: 2024-10-09T17:08:04Z
slug: qiniu-campus-llgo-rust-ecosystem
draft: false
featured: true
description: 讲解这三个月以来对 LLGo Rust 生态探索包括 Rust 语言对接 LLGo 、异步运行时和net/http 框架的实现
---

之前写了一篇文章总结在七牛云 1024 实训营的这三个月的体验，今天写一篇偏技术方向的博客作为总结

## 目标

我们的目标最开始是比较凌乱和无序的，后来经过和导师讨论确立了以下几个方向：

- Rust FFI 到 LLGo 的移植
- Rust 高效类库移植到 LLGo
- 使用 [Libuv](https://github.com/libuv/libuv) 为 LLGo 实现异步 I/O 能力
- 使用 [Hyper](https://github.com/hyperium/hyper) 实现 LLGo 的 `net/http` 部分
- 使用 [tokio/io-uring](https://github.com/tokio-rs/io-uring) 为 LLGo 加速异步 I/O 能力

可以说我们基本所有的目标都是在为实现一个高效的 `net/http` 功能而服务，因为我本身有 Rust 的相关开发经验，所以在综合考量了 Rust 语言具有内存/线程安全、高性能、良好的开发体验等特性，我们最终选择了开辟 Rust 这一领域来填补 LLGo 在这方面的空缺。另外我们也考虑到了 Rust 语言 Web 框架经常在 [TechEmpower](https://www.techempower.com/benchmarks/#hw=ph&test=fortune&section=data-r22) 测评中强势霸榜，所以我们选择了知名 Web 框架 [Axum](https://github.com/tokio-rs/axum)的底层类库 [Hyper](https://github.com/hyperium/hyper) 作为基础。后续我们在实践中发现 Hyper 并没有将异步I/O 这部分暴露到 FFI 中，所以我们需要自己实现一套异步运行时，在综合考量后我们选择了 [Libuv](https://github.com/libuv/libuv) 作为我们的异步实现，作为 C 生态的老牌异步运行时也同是作为 `Node.js` 的默认实现，性能和稳定性都尚佳。

## 前置准备

### Rust FFI 绑定

在做任何工作之前，我们首先要保证可以使 Rust 程序可以被 LLGo 调用。众所周知，Rust 是一个 LLVM 作为后端的语言，所以我们尝试了将 Rust 程序作为动态链接库使用，并且暴露 C 兼容的接口，也踩了一些坑：

**对于一般的 Rust 程序我们有以下步骤**

#### 添加依赖

添加必要的 Cargo 依赖项并进行配置以生成兼容C语言的动态库

```toml
[dependencies]
libc = "0.2"

[lib]
crate-type = ["cdylib"]
```

#### 修饰函数

用 `no mangle` 修饰函数保证函数不被 LLVM 优化函数名和使用 `extern C`修饰Rust函数使其在内存中使用 C 兼容的形式

```rust
#[no_mangle]
pub unsafe extern "C" fn add_numbers_c(a: i32, b: i32) -> i32 {
    add_numbers(a, b)
}
```

#### 使用堆内存

使用`Box` 来管理动态类型（非标准库基础类型），返回 `mutable` 指针类型；同时需要注意当有变量需要在 FFI 传递的时候需要把内存管理权交给 FFI 调用侧，也就是说需要手动 Drop 资源

```rust
#[no_mangle]
pub unsafe extern "C" fn sled_create_config() -> *mut Config {
    Box::into_raw(Box::new(Config::new()))
}

#[no_mangle]
pub unsafe extern "C" fn sled_free_config(config: *mut Config) {
    drop(Box::from_raw(config));
}
```

#### 字符串使用

使用 `Cstring` 来传递字符串量

```rust
#[no_mangle]
pub extern "C" fn csv_reader_read_record(ptr: *mut c_void) -> *const c_char {
    // ...
    match CString::new(format!("{:?}\n", record)) {
        Ok(c_string) => c_string.into_raw(),
        Err(_) => ptr::null(),
    }
    // ...
}
```

#### 安装动态链接库

安装（声明）动态链接库位置，这里可以用我使用 Rust 语言编写的一个小工具 [ dylib-installer ](https://github.com/hackerchai/dylib-installer) 来安装动态链接库和头文件，这个工具可以再 MacOS/Linux 环境下工作：

```bash
sudo dylib_installer <dylib_lib> <header_file_lib>
```

以上我们完成了一个简单的 Rust 程序的 FFI 暴露，如果需要验证的话我们可以自行编写 C 程序进行测试

### 异步运行时

在最初的对于 Hyper 的 FFI 探索中我们发现： [Hyper](https://github.com/hyperium/hyper/blob/master/capi/examples/client.c) 的官方实现是需要 FFI 调用侧手动实现异步 I/O 的，诸如：select/poll/epoll，所以测试我们选择了 [Libuv](https://github.com/libuv/libuv) 作为选型，具体实现可以参考 [goplus/llgo/c/libuv](https://github.com/goplus/llgo/tree/main/c/libuv) ，我们选择了比较常用的函数进行了迁移，得益于 LLGo 的一些注释以及语法糖我们可以很轻松的迁移函数到 LLGo：

#### 迁移 Libuv

##### 迁移普通函数

C 版本：

```c
struct uv_fs_s {
  UV_REQ_FIELDS
  uv_fs_type fs_type;
  uv_loop_t* loop;
  uv_fs_cb cb;
  ssize_t result;
  void* ptr;
  const char* path;
  uv_stat_t statbuf;  /* Stores the result of uv_fs_stat() and uv_fs_fstat(). */
  UV_FS_PRIVATE_FIELDS
};
typedef struct uv_fs_s uv_fs_t;

UV_EXTERN int uv_fs_open(uv_loop_t* loop,
                         uv_fs_t* req,
                         const char* path,
                         int flags,
                         int mode,
                         uv_fs_cb cb);
```

LLGo 版本：

```go
type Fs struct
{
	Unused [440]byte
}

//go:linkname FsOpen C.uv_fs_open
func FsOpen(loop *Loop, req *Fs, path *c.Char, flags c.Int, mode c.Int, cb FsCb) c.Int
```

对于结构体的映射我们现在还是采用一个临时解决办法，为了避免非指针引用结构体带来的一些内存问题，我们手动在 64 位机器上获取了每个结构体的大小（这也代表如果在非 64 位系统运行 LLGo 可能会有潜在的问题），并且将其填入 `Unused` 字段用来标记，后面我们可能会采用自动工具进行自动字段迁移

这里我们使用 `go:linkname` 注释去关联 C 函数和 Go 函数，注意我们将使用一些 LLGo 私有的C兼容变量类型进行映射，具体规则可以参考 [Type Mapping](https://github.com/goplus/llgo/blob/main/doc/Type-Mapping-between-C-and-Go.md)

##### 迁移方法函数

C版本：

```c
UV_EXTERN int uv_accept(uv_stream_t* server, uv_stream_t* client);
```

LLGo 版本：

```go
// llgo:link (*Stream).Accept C.uv_accept
func (server *Stream) Accept(client *Stream) c.Int {
	return 0
}
```

这里我们使用 LLGo 实现的注释语法糖，默认第一个参数作为方法的接受方，其余参数保持不变

#### 使用 Libuv

这里给出一个小例子演示如何使用 LLGo 和 Libuv 完成对于一个端口的监听操作：

```go
loop := libuv.DefaultLoop()

var server libuv.Tcp
libuv.InitTcp(loop, &server)

var addr cnet.SockaddrIn
libuv.Ip4Addr(c.Str("0.0.0.0"), DEFAULT_PORT, &addr)

server.Bind((*cnet.Sockaddr)(unsafe.Pointer(&addr)), 0)
r := (*libuv.Stream)(unsafe.Pointer(&server)).Listen(DEFAULT_BACKLOG, onNewConnection)
if r != 0 {
  fmt.Fprintf(os.Stderr, "Listen error %s\n", c.GoString(libuv.Strerror(libuv.Errno(r))))
  return 1
}
loop.Run(libuv.RUN_DEFAULT)
```

如果需要了解更多 Libuv 的用法可以参阅其[文档](https://docs.libuv.org)

## 技术实现

为了实现一个 `net/http` 的 Server 部分，我们采用了如下的设计架构：

![](https://blog.cdn.hackerchai.com/images/2024/10/llgo-net-http-server.png)

为了加速性能和利用 CPU 多核特性，我们采用了 `thread-per-core` 的架构设计，一个 CPU 核心对应一个 Libuv 的 EventLoop 并且对应一个 Hyper 的 Executor，当 Client 请求进入后我们会使用 Libuv 的异步 I/O 能力将其读入缓冲区，并利用 Libuv 事件循环促使 Hyper Executor 进行 Poll Task 操作完成对于 Request 的处理；此时我们进行 `HTTPServe` 的操作执行用户逻辑，并再次调用 Hyper Executor 进行 Poll Task 操作将 Response 发送给 Client 。这部分的 `HTTPServe` 逻辑我们参考了 Golang 标准库的实现：

```go
type Handler interface {
	ServeHTTP(ResponseWriter, *Request)
}

type ResponseWriter interface {
	Header() Header
	Write([]byte) (int, error)
	WriteHeader(statusCode int)
}
```

我们需要实现接口所定义的方法，并且将 Server 的监听和 Connection 的处理配置得当即可：

```go
// listen for new connections
if r := (*libuv.Stream)(&el.uvServer).Listen(128, onNewConnection); r != 0 {
	return fmt.Errorf("failed to listen: %s", c.GoString(libuv.Strerror(libuv.Errno(r))))
}

// onNewConnection is the libuv callback function for new connections.
func onNewConnection(serverStream *libuv.Stream, status c.Int) {
  ...
	if serverStream.Accept((*libuv.Stream)(unsafe.Pointer(&conn.Stream))) == 0 {
    ...
    userData := createServiceUserdata()
    userData.executor = el.executor
    ...
  }
}
```

在上述代码中我们展示了利用 Libuv 来实现端口监听，连接处理等操作，并且在处理新连接时将 EventLoop 中的 Hyper Executor 进行复用

```go
// onIdle is the libuv callback function for running libuv event loop.
func onIdle(handle *libuv.Idle) {
	el := (*eventLoop)((*libuv.Handle)(unsafe.Pointer(handle)).GetLoop().GetData())
	if el.executor != nil {
		// poll the hyper executor for tasks
		task := el.executor.Poll()
		for task != nil {
			handleTask(task)
			task = el.executor.Poll()
		}
	}

	if el.shuttingDown() {
		fmt.Println("Shutdown initiated, cleaning up...")
		handle.Stop()
	}
}
```

上述代码使用 `executor` 在 Libuv 事件循环中进行循环 Poll Task。最终我们的代码可以在 [ feat(x/net/http): Implement server and client function ](https://github.com/goplus/llgoexamples/pull/17) 找到，下面是一个最小 demo

```go
import (
	"fmt"

	"github.com/goplus/llgo/x/net/http"
)

func echoHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Printf(">> %s %s HTTP/%d.%d\n", r.Method, r.RequestURI, r.ProtoMajor, r.ProtoMinor)
	for key, values := range r.Header {
		for _, value := range values {
			fmt.Printf(">> %s: %s\n", key, value)
		}
	}
	fmt.Printf(">> URL: %s\n", r.URL.String())
	fmt.Printf(">> RemoteAddr: %s\n", r.RemoteAddr)

	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte("Hello, World!"))
}

func main() {
	http.HandleFunc("/echo", echoHandler)

	fmt.Println("Starting server on :1234")
	server := http.NewServer("127.0.0.1:1234")
	if err := server.ListenAndServe(); err != nil {
		panic(err)
	}
}
```

我们可以像使用 Golang 标准库一样编写代码

## 基准测评

我们使用 [wrk](https://github.com/wg/wrk) 配合限制程序使用核心数量，使用6个线程和100/1000个连接进行基准测试

测试环境：

```bash
macOS 15.1 24B5055e arm64, Darwin 24.1.0, Apple M3 Pro (12) @ 4.06 GHz, 36864MiB
```

测试结果：

| Language | qps-100c | qps-1000c | diff     |
| -------- | -------- | --------- | -------- |
| LLGo     | 42257.73 | 37401.09  | 0.00%    |
| Golang   | 97282.51 | 95185.08  | +154.50% |

| Language | qps-100c | qps-1000c | diff   |
| -------- | -------- | --------- | ------ |
| LLGo     | 40612.14 | 43051.82  | 0.00%  |
| C        | 67660.83 | 70277.74  | +66.6% |

这个基准测试显示，Golang 的 `net/http` 比 LLGo 的 `net/http` 快约 154%，而在相同代码逻辑下，纯 C 语言的实现比 LLGo 快约 66.6%

## 总结

从上面的结果看出我们的性能仍然和 Golang 标准库有巨大的差距，我们总结有以下几点：

- 对于资源的复用和回收可能还有优化的空间
- FFI 和动态链接库本身有一定的性能损耗
- Hyper Server 部分的 FFI [实现](https://github.com/hyperium/hyper/pull/3084) 仍然存在一些问题， Server Task 的处理方式仍然有待商榷，毕竟这个 PR #3084 并没有进入主线
- LLGo 本身的开销，参考 `纯 C 语言的实现比 LLGo 快约 66.6% ` 这个结果

总而言之，这是我目前经历到的最棒的一段实习。也很感谢我的导师们 [傲飞老师](https://github.com/aofei) 、 [七叶老师](https://github.com/visualfc) 、 [长军老师](https://github.com/CarlJi) 还有 [老许](https://github.com/xushiwei) 的倾情指导，让我对于系统底层和 Golang 底层有了更深刻的理解。也要感谢以下我的几位给力队友：[英杰](https://github.com/spongehah)、[之阳](https://github.com/luoliwoshang)，如果没有他们我可能很难独自完成这么复杂的工作。

## 链接

- 幻灯片： [qiniu-campus-slide](https://qiniu-campus-slide.vercel.app/)
- 适配 Libuv 的 Hyper FFI 分支： [feature/server-ffi-libuv-demo](https://github.com/hackerchai/hyper/tree/feature/server-ffi-libuv-demo)
