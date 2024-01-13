---
title: 阅读--Ruby 基础
date: 2024-1-13 09:36:12
tags:
  - 阅读
  - Ruby
categories:
  - [阅读]
  - [Ruby]
---


### Install
如同 nvm， ruby 也有自己管理版本的工具 `rbenv`, 在 mac 上安装：
```bash
brew install rbenv ruby-build

rbenv init
```
然后设置环境变量：
```bash
# Rbenv
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"
```
接着安装 ruby 较新的版本：
```bash
rbenv install 3.2.2
rbenv global 3.2.2
```

### Basic Data Types
Ruby 是一门面向对象的语言，同时也包含基础类型：numbers, strings, symbols, booleans(true, false, nil)

`numbers` 类型就不必多赘述，与其他语言语法差不多。

`strings` 的操作多种多样，如果想拼接字符串可以：
```ruby
"hello" + "world"
"hello" << "world"
"hello".concat("world")
```
对于裁剪字符串可以直接使用 `[]` 进行取值，有以下几种用法：
```ruby
"hello"[0] # => 'h'
"hello"[0...1] # => 'he'
"hello"[0, 4] # => 'hell'
"hello"[-1] # => 'o'
```
类似于 js 中的模板字符串，ruby 中也有, 不过得用双引号的字符串才会生效:
```ruby
name = "xx"

puts "Hello, #{name}" #=> "Hello, xx"
```

`symbol` 在 ruby 中好像稍微有点复杂？可能也是像 js 中表示唯一，刚开始不打算深入了，只了解了一些基本概念：
```ruby
# 创建 symbol
:my_symbol

"string" === "string" # => true

"string".object_id == "string".object_id  #=> false

:symbol.object_id == :symbol.object_id    #=> true
```

`nil` 相当于什么都没有，Ruby 中任何事物都会返回值，但如果没有指定，将会默认返回 nil。

### Conditional Logic
条件逻辑是语言中必备的语法，在 ruby 中一段代码以 end 结束:

#### if...else
```ruby
logic_boolean = false
if logic_boolean == true
  puts "hello~~"
else
  puts "false"
end
```

只要非 false 与 nil，在 Ruby 中就为真, 不过**需要注意的是**，在其他语言中 `""` 与 `0` 会被认定为 falsy 值，但在 Ruby 中他们两都为 **true**。
```ruby
condition_empty = ""
condition_zero = 0

if condition_empty
  puts "is empty" # => is empty
end

if condition_zero
  puts "is zero" # => is zero
end
```

`if...elsif...else`:
```ruby
if attack_by_land == true
  puts "release the goat"
elsif attack_by_sea == true
  puts "release the shark"
else
  puts "release Kevin the octopus"
end
```

#### Case
除了 if else，Ruby 同样有 Case
```ruby
grade = 'F'

did_i_pass = case grade 
  when 'A' then "Hell yeah!"
  when 'D' then "Don't tell your mother."
  else "'YOU SHALL NOT PASS!' -Gandalf"
end
```


#### Unless
Unless 与 if 正好相反，如果表达式为 `false` 就处理代码块中的内容：
```ruby
age = 19
puts "Welcome to a life of debt." unless age < 18

unless age < 18
  puts "Down with that sort of thing."
else
  puts "Careful now!"
end
```

#### 三元运算符
```ruby
age = 19
response = age < 18 ? "11111" : "2222"
puts response #=> "2222"
```

#### 对比
在对变量进行对比时，可以使用各种数学逻辑运算符例如 `==, >=, <=, <, >` 。同时 Ruby 内部对象的 eql 方法也能使用：
```ruby
5.eql?(5.0) #=> false; although they are the same value, one is an integer and the other is a float
5.eql?(5)   #=> true
```

```ruby
a = "hello"
b = "hello"
a.equal?(b) #=> false
```
计算机在存储字符串时不像存储数字那样有效率，虽然变量的值是相同的，但在计算机内存中创建了两个独立的字符串对象。所以会返回 false。

在 ruby 中还有一个特殊的操作符称之为飞船操作符 `<=>`
- -1: 如果左边值比右边小则返回 -1
- 0 : 如果左右相等则返回 0
- 1 : 如果左边比右边大则返回 1

```ruby
5 <=> 10    #=> -1
10 <=> 10   #=> 0
10 <=> 5    #=> 1
```

### Loops 

#### Loop

Ruby 中循环中有一种方式就名为 `loop`, 它是无限循环默认不会退出, 只有当加入 `break` 语句才会退出。不过据说不太常用。
```ruby
i = 0
loop do
  puts "i is #{i}"
  i += 1
  break if i == 10
end
```

#### While loop
```ruby
i = 0
while i < 10 do
 puts "i is #{i}"
 i += 1
end
```

#### Until loop
Until 循环与 While 相反，While 是条件为真执行，而 Until 是条件为假去执行。


#### Ranges
Ranges 的语法糖十分方便，简单的语法就能够生成指定字符或数字的区间：
```ruby
(1..5)      # inclusive range: 1, 2, 3, 4, 5
(1...5)     # exclusive range: 1, 2, 3, 4

# We can make ranges of letters, too!
('a'..'d')  # a, b, c, d
```

#### For 
```ruby
for i in 0..5
  puts "#{i} zombies incoming!"
end
```

#### Times
如果想要遍历指定次数可以使用 `.times`:
```ruby
5.times do
  puts "Hello, world!"
end
```

#### Upto Downto
Upto Downto 完全符合语义化，由下至上与由上至下遍历：
```ruby
5.upto(10) { |num| print "#{num} " }     #=> 5 6 7 8 9 10

10.downto(5) { |num| print "#{num} " }   #=> 10 9 8 7 6 5
```

### Arrays
基本的数组：
```ruby
num_array = [1, 2, 3, 4, 5]
str_array = ["This", "is", "a", "small", "array"]
```

使用 new 创建的数组
```ruby
Array.new               #=> []
Array.new(3)            #=> [nil, nil, nil]
Array.new(3, 7)         #=> [7, 7, 7]
Array.new(3, true)      #=> [true, true, true]
```

使用 #first #last 截取指定数量数组
```ruby
str_array = ["This", "is", "a", "small", "array"]

str_array.first         #=> "This"
str_array.first(2)      #=> ["This", "is"]
str_array.last(2)       #=> ["small", "array"]
```

添加与删除：
```ruby
num_array = [1, 2]

num_array.push(3, 4)      #=> [1, 2, 3, 4]
num_array << 5            #=> [1, 2, 3, 4, 5]
num_array.pop             #=> 5
num_array                 #=> [1, 2, 3, 4]
```

连接数组：
```ruby
a = [1, 2, 3]
b = [3, 4, 5]

a + b         #=> [1, 2, 3, 3, 4, 5]
a.concat(b)   #=> [1, 2, 3, 3, 4, 5]
```

去除指定数字:
```ruby
[1, 1, 1, 2, 2, 3, 4] - [1, 4]  #=> [2, 2, 3]
```

一些默认方法:
```ruby
[].empty?               #=> true
[[]].empty?             #=> false
[1, 2].empty?           #=> false

[1, 2, 3].length        #=> 3

[1, 2, 3].reverse       #=> [3, 2, 1]

[1, 2, 3].include?(3)   #=> true
[1, 2, 3].include?("3") #=> false

[1, 2, 3].join          #=> "123"
[1, 2, 3].join("-")     #=> "1-2-3"
```


### Hashes 
```ruby
my_hash = {
  "str" => "ahoy",
  "num" => 94,
  "arr" => [1, 2, 3],
  "empty_hash" => {}
}
```
可以看到，键值对中间使用 => 符号进行映射。

不过，Ruby 比较宽松，不仅可以使用 string 当 key，也可以使用其他类型作为 key:
```ruby
hash = { 9 => "nine", :six => 6 }
```

获取键对应的值，可以：
```ruby
my_hash["str"] # => ahoy
my_hash["aaaa"] # => nil

my_hash.fetch("aaaaa") # => KeyError: key not found: "aaaaa"
```

删除使用 delete 操作符：
```ruby
my_hash.delete("str")
{"num"=>94, "arr"=>[1, 2, 3], "empty_hash"=>{}}
```

使用 Symbols 作为 hash 的 key，在火箭操作符下在 key 前使用 `:`，或者在中间加上 `:`  :

```ruby
# 'Rocket' syntax
american_cars = {
  :chevrolet => "Corvette",
  :ford => "Mustang",
  :dodge => "Ram"
}
# 'Symbols' syntax
japanese_cars = {
  honda: "Accord",
  toyota: "Corolla",
  nissan: "Altima"
}
```

在获取时需要加上 `:`

```ruby
american_cars[:ford]    #=> "Mustang"
japanese_cars[:honda]   #=> "Accord"
```
