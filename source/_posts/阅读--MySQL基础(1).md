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


## 数据库基本操作
查看都有哪些数据库：`SHOW DATABASES;`
创建数据库: `CREATE DATABASE 数据库名;`
删除数据库: `DROP DATABASE 数据库名;`

对于每一个连接到 MySQL 服务器的客户端，都有一个 **当前数据库** 的概念，创建的表默认都会放到当前数据库中，使用 `USE 数据库名称;` 切换。

不过如果退出了客户端，再进入就是新的客户端了，不会默认选择当前数据库。所以可以直接在命令后方加上数据库名即可。

## 表的基本操作
查看有哪些表: `SHOW TABLES;`
查看表结构: `DESC 表名; EXPLAIN 表名;`
如果没有选择当前数据库时要查看表：`SHOW TABLES FROM xxx;`
重命名：`ALTER TABLE 旧表名 RENAME TO 新表名;  RENAME TABLE 旧表名1 TO 新表名1, 旧表名2 TO 新表名2, ... 旧表名n TO 新表名n;`
增加列：`ALTER TABLE 表名 ADD COLUMN 列名 数据类型 [列属性];`

创建表：
```sql
CREATE TABLE 表名 (
  列名1 数据类型 [列的属性]
);
```

定义上这个表的各个列的信息，包括列的名称、列的数据类型，如果有需要的话也可以定义这个列的属性（列的属性用中括号[]引起来的意思就是这部分是可选的，也就是可有可无的）

如果需要添加注释则可以在表的末尾跟上 `COMMENT '';`
```sql
CREATE TABLE 表名 (
  列名1 数据类型 [列的属性]
) COMMENT '表';
```


## 简单的查询插入语句
查看表里存了哪些数据：`SELECT * FROM 表名;`

MySQL 插入数据的时候是以行为单位的：
`INSERT INTO 表名(列1, 列2, ...) VALUES(列1的值，列2的值, ...);`
`INSERT INTO first_table(first_column, second_column) VALUES(1, 'aaa');`

批量插入数据: `INSERT INTO 表名(列1,列2, ...) VAULES(列1的值，列2的值, ...), (列1的值，列2的值, ...), (列1的值，列2的值, ...), ...;
`

### 主键与候选键
有时候需要在表里通过**某个列**或者**某些列**确定记录，可以把这些列称为 `候选建`，比如我们可以通过身份证作为主键，学号与身份证号作为候选键。

如果主键只是单个列，可以直接在列后方声明 `PRIMARY KEY`。`id INT PRIMARY KEY` 也可以放在整个表的后方：
```sql
CREATE TABLE student_info (
    number INT,
    name VARCHAR(5),
    sex ENUM('男', '女'),
    id_number CHAR(18),
    department VARCHAR(30),
    major VARCHAR(30),
    enrollment_time DATE,
    PRIMARY KEY (number, name)
);
```

并且主键默认会有 `NOT NULL` 属性。

对于候选键则是 `UNIQUE`，与主键用法一致。不过给候选键起个约束名称 `UNIQUE KEY uk_id_number (id_number)`，写不写都可以，MySQL 会自己帮我们起名。


在 MySQL 中，每张表只能有一个主键。也就是 `PRIMARY KEY`（只能写一行 PRIMARY KEY）。但是却可以有多个 `UNIQUE KEY`

### 外键
外键也是一种约束，外键定义了一个表中的列，该列的值必须与另一个表的主键的值相匹配。相当于将一个表与另一个表关联起来，而关联的方式就是用主键进行关联。例如父子关系，一对多关系等。

```sql
CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  customer_id INT,
  order_date DATE,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);
```
在上面的示例中，orders 表中的 customer_id 列被定义为外键，它引用了 customers 表中的 customer_id 列作为主键。这样，orders 表中的每个 customer_id 值都必须在 customers 表中存在。

外键约束可以确保数据的一致性，防止在关联表之间出现不一致的数据。当试图插入或更新数据时，如果违反了外键约束，MySQL 将拒绝操作并抛出错误。


### AUTO_INCREMENT
AUTO_INCREMENT 可以翻译为自增。如果某列类型为整数或浮点数，不指定值时，那么新插入的值就会自己 +1。

### ZEROFILL 
ZEROFILL ，对于无符号整数类型，可以在查询数据的时候让数字左边补0，补 0 的个数根据显示宽度来决定，有可能是在定义类型 INT() 括号里进行指定。

在创建表的时候，如果声明了ZEROFILL属性的列没有声明UNSIGNED属性，那MySQL会为该列自动生成UNSIGNED属性。

### 一个列同时具有多个属性
每个列可以同时具有多个属性，属性声明的顺序无所谓，各个属性之间用空白隔开就好了～
注意，有的属性是冲突的，一个列不能具有两个冲突的属性，。如一个列不能既声明为PRIMARY KEY，又声明为UNIQUE KEY，不能既声明为DEFAULT NULL，又声明为NOT NULL。
