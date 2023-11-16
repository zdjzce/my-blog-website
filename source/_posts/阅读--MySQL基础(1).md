---
title: 阅读--MySQL基础(1)
date: 2023-11-16 12:47:12
tags:
  - 阅读
  - MySQL
categories:
  - [阅读]
---


## 安装与使用
### 安装
MacOS14.0 目前 MySQL@8.0.1 已经兼容，可以直接使用 homebrew 进行安装，安装完毕后会安装 homebrew 自带的 services，services 可以用来启动 MySQL 服务。

安装完毕后就可以设置 MySQL 客户端的账户密码了:
```bash
# 或者 sudo mysql
mysql -u root 

ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';

# 刷新权限
FLUSH PRIVILEGES;

# 使用密码登录
mysql -u root -p
```

### 启动服务与客户端

homebrew 安装的 MySQL 启动服务较 windows 较为便利(windows 似乎还要设置 datadir 还要设置各种环境变量...)：
```bash
# 开始
brew services start mysql

# 暂停
brew services stop mysql
```


接着登录客户端，可以登录远端客户端（登录远端客户端需要更改本地 MySQL 配置文件 my.conf 将 IP 设置为 0.0.0.0）或直接登录本地客户端：
```bash
mysql -h主机名 -u用户名 -p密码

# 本机登录
mysql -uroot -p123456

# 或者之后再输入密码
mysql -u root -p

```

### 语句注意事项
1. `\g \G ;` 三个符号放在语句末尾即结束，没有这三个符号之一将会继续输入语句。
2. `\c` 放弃本次操作
3. 虽然默认对大小写没有限制，不过按照习俗，命令与函数一般都是大写。而数据库名，表名，列名都是要小写的，**属于书写规范**。


当一条命令从客户端发送给了MySQL服务器之后，服务器处理完后就会给客户端发送回来处理结果，然后显示到界面上。然后你就可以接着输入下一条命令了。



## 数据类型
MySQL 以表进行存储，而表中由行和列组成，列对应不同的属性，行代表着属性对应的值，而值也有许多类型

### 数值类型
#### 整数类型
数值范围越大，也就意味着越小号存储空间，根据一个数字节不同，MySQL 把**整数**分成如下类型:
1. `TINYINT`，1Byte，非常小的整数
2. `SMALLINT`, 2Byte, 小的整数
3. `MEDIUMINT`，3Byte, 中等大小整数
4. `INT`，4Byte, 标准整数
5. `BIGINT`, 8Byte, 大整数 


#### 浮点数
1. FLOAT, 4Byte, 单精度浮点数
2. DOUBLE, 8Byte, 双精度浮点数

用法：`FLOAT(M, D)  DOUBLE(M, D)`，其中 M 代表有效数字数（就是所有数字数量的和），D 代表小数点后的数量。


#### 定点数
浮点数表示会有不精确情况，有些场景需要保证小数精确。
`DECIMAL(M, D)`

定点数是一种精确的小数，为了达到精确的目的我们就不能把它转换成二进制小数之后再存储(因为有很多十进制小数转为二进制小数后需要进行舍入操作，导致二进制小数表示的数值是不精确的),
而应该把小数点左右两边的十进制数分别存储。

不过定点数需要更多的空间来存储数据，如果使用 `DECIMAL(16, 4)` 来存储十进制小数 `1234567890.1234` 会被划分成三个部分:
```
1 234567890 1234
```

存储每一组数字数量的不同，存储的大小也不同：
1. 1 或 2 个十进制位数，1Byte
2. 2 或 3 个十进制位数，2Byte
3. 4 或 5 个十进制位数，3Byte
4. 7/8/9  个十进制位数，4Byte

上面的数字`1 234567890 1234`需要 8 个字节才能进行存储。

#### 无符号数值
无符号数值即非负数，在 MySQL 中原始值类型后方加上 `UNSIGNED` 
比如， `INT UNSIGNED` 即 无符号整数，`FLOAT UNSIGNED` 即无符号浮点数， `DECIMAL UNSIGNED` 无符号定点数


### 日期和时间类型
MySQL 分为以下日期和时间类型：
1. YEAR, 1Byte, 年份值
2. DATE, 3Byte, 日期值
3. TIME, 3Byte, 时间值
4. DATETIME, 8Byte, 日期加时间
5. TIMESTAMP, 4Byte, 时间戳

在MySQL5.6.4这个版本之后，`TIME、DATETIME、TIMESTAMP`这几种类型添加了对毫秒、微秒的支持。

如果想让上述三种时间支持小数秒，可以这样写: `DATETIME(0)` 表示精确到秒，DATETIME(3) 表示精确到毫秒。DATETIME(5) 精确到 10 微秒。

### 字符串类型
字符串分为两种，`可见字符` 与 `不可见字符`。可见字符就是人眼能看到的文字、符号、图形等... 不可见字符例如换行、制表符、只是为了控制输出结果的字符。

1. CHAR(M)，M 个字符，固定长度
2. VARCHAR(M), M 个字符，可变长度的字符串
3. TINYTEXT, 非常小的字符串
4. TEXT, 小型字符串
5. MEDIUMTEXT, 中型字符串
6. LONGTEXT, 大型字符串
7. ENUM，枚举字符串
8. SET, 字符串集合

### 二进制类型

#### BIT


#### BINARY(M) 与 VARBINARY(M)
与前文字符串有点类似，固定与可变长度。M 代表最多能存放的字符数量。


#### 其他二进制
TINYBLOB、BLOB、MEDIUMBLOB、LONGBLOB是针对数据量很大的二进制数据提出的，比如图片、音频、压缩文件啥的。它们很像TINYTEXT、TEXT、MEDIUMTEXT、LONGTEXT，不过各种BLOB类型是用来存储字节的，而各种TEXT类型是用来存储字符的而已。