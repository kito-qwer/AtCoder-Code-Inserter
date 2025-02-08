# AtCoder Code Inserter

AtCoder Code Insertet は、AtCoder のコードテストページにおいて、コードエディタ内でコメント形式のコマンドを利用してコード素片を保存・挿入できるようにする Tampermonkey ユーザスクリプトです。C 系など`//`のコメント文が使える言語で使えます。

## 機能

- 保存 save
	エディタ内のコードを指定したキーでローカルストレージに保存する。
- 挿入 insert
	保存されたコード素片を指定したキーでエディタ内に挿入する。
- 削除 remove
	指定されたキーのコード素片を削除します。
- 一覧表示 list
	保存されているキーの一覧を表示します
- ヘルプ help
	利用可能なコマンドの説明をします。

## インストール方法

1. [Tampermonkey](https://www.tampermonkey.net/) をブラウザにインストールします。
2. [ここ](https://raw.githubusercontent.com/kito-qwer/AtCoder-Code-Inserter/refs/heads/master/AtCoderCodeInserter.user.js)をクリックすると Tampermonkey が起動するので指示に従いインストールします。
3. AtCoder のコードテストのページにアクセスするとスクリプトが実行され、"Open File" ボタンの下に "ACI Run" のボタンが追加されます。

## 使い方

### コマンドの記法

エディタ内に以下の形式でコメントを書きます。
それぞれのコマンドはエディタ内に記述し、スクリプトを実行することで順次展開されます。

```C++
// @aci <command> [key]
```

### 利用可能なコマンド

- save [key]

コマンドから次のコマンド (または EOF) までの内容を指定したキーで保存します。

```C++
// @aci save add
int add(int a, int b){
	return a+b;
}
```

- insert [key]

指定されたキーで保存されているコード素片を挿入します。

```C++
// @aci insert add
```

- remove [key]

指定されたキーのコード素片を削除します。

```C++
// @aci remove [key]
```

- list

保存されているすべてのキーを一覧表示します。

```C++
// @aci list
```

- help

利用可能なコマンドとその説明の表示をします。

```C++
// @aci help
```

### 実行方法

追加されたボタンをクリックするか、`Ctrl + Shift + Enter`のショートカットで実行できます。

## 注意点

- コードテストでのみ動作します。
- 保存先がローカルストレージであるので同一ブラウザ・PC内でのみ利用可能です。
- コマンドの記述は`//`の後に続けて行う必要があります。そのため、この形式を認めていない言語で使用したい場合はスクリプトを改造するか、ブロックコメントで囲むなどの対策をしてください。


