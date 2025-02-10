// ==UserScript==
// @name         AtCoder Code Inserter
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  AtCoderのコードエディタに登録したコードを挿入する
// @author       Qvito
// @match        https://atcoder.jp/contests/*/custom_test*
// @grant        unsafeWindow
// ==/UserScript==

/*
Update
v1.1.0: 名前空間の追加, ファイル構造の変更, 移行処理
*/

let version = "1.1.0";

(function() {
    'use strict';

    const lang = unsafeWindow.LANG == "en" ? 0 : 1;
    migrateDate1_1_0();
    let targetElement = document.querySelector("#btn-open-file"); // ID指定
    if (targetElement) {
        let runButton = document.createElement("button");
        let runButtonName = ["ACI Run", "ACI を実行"]
        runButton.className = "btn btn-default btn-sm";
        runButton.setAttribute("autocomplete", "off");
        runButton.setAttribute("aria-pressed", "false");
        runButton.textContent = runButtonName[lang];
        runButton.addEventListener("click", () =>{
            runACI();
        });
        let whitespaceNode = document.createTextNode("\n\t\t\t");
        targetElement.parentNode.insertBefore(runButton, targetElement.nextSibling);
        targetElement.parentNode.insertBefore(whitespaceNode, targetElement.nextSibling);
    }

    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
            event.preventDefault();
            runACI();
        }
    });

    function runACI(){
        let source = getSource();
        source = aciProcess(source);
        setSource(source);
    }
})();

function migrateDate1_1_0(){
    let keys = [];
    let str = "";
    for (let i = 0; i < localStorage.length; i++){
        let key = localStorage.key(i);
        if(key.indexOf("ACI_") === 0){
            keys.push(key.substring(4));
        }
    }
    for(let i = 0; i < keys.length; i++){
        str += "// @aci save " + keys[i] + "\n";
        str += localStorage.getItem("ACI_" + keys[i]) + "\n";
        // str += "// @aci remove " + keys[i] + "\n";
    }
    aciProcess(str);
    for(let i = 0; i < keys.length; i++){
        localStorage.removeItem("ACI_" + keys[i]);
    }
}

function aciProcess(source){
    const aciprefix = "// aci| ";
    const localStorageItemName = "aci1_codes"
    const namespaceOperator = "::";
    let codes;
    let namespace = "default";
    function getCodes(){
        let codes = localStorage.getItem(localStorageItemName);
        codes = codes == null ? '{}' : codes;
        return JSON.parse(codes);
    }
    function setCode() {
        localStorage.setItem(localStorageItemName, JSON.stringify(codes));
    }

    function createCodesObject(namespace, key) {
        if (!codes[namespace]) {
            codes[namespace] = {};
        }
        if (!codes[namespace][key]) {
            codes[namespace][key] = {};
        }
    }
    function restructureWords(words, aciprefix){
        let str = aciprefix + ">";
        for(let i = 0; i < words.length && words[i] != "\n"; i++){
            str += " " + words[i];
        }
        str = str.replace(/ :: */g, namespaceOperator);
        return str;
    }
    let process = {
        namespace : (words, remainingSource) => {
            let key = words[1];
            namespace = key;
            let str = "// @aci namespace " + key + "\n" + remainingSource;
            return str;
        },
        insert : (words, remainingSource) => {
            let key = words[2] == namespaceOperator ? words[3] : words[1];
            let tnamespace = words[2] == namespaceOperator ? words[1] : namespace;
            let str = restructureWords(words, aciprefix) + "\n";
            let tmp = codes[tnamespace]?.[key]?.source || null;
            if(tmp != null){
                str += tmp;
                str += aciprefix + "inserted " + tnamespace + namespaceOperator + key + "\n";
            }
            else str += aciprefix + "not exist code\n";
            str += remainingSource;
            return str;
        },
        save : (words, remainingSource) => {
            let key = words[2] == namespaceOperator ? words[3] : words[1];
            let tnamespace = words[2] == namespaceOperator ? words[1] : namespace;
            let str = restructureWords(words, aciprefix) + "\n";
            if(key){
                createCodesObject(tnamespace, key);
                codes[tnamespace][key].source = remainingSource.trim().replace(/\n+/g, "\n") + "\n";
                return str + aciprefix + "saved " + tnamespace + namespaceOperator + key + "\n" + remainingSource;
            }
            return str + aciprefix + "not exist key\n" + remainingSource;
        },
        remove : (words, remainingSource) => {
            let key = words[2] == namespaceOperator ? words[3] : words[1];
            let tnamespace = words[2] == namespaceOperator ? words[1] : namespace;
            let str = restructureWords(words, aciprefix) + "\n";
            if(key){
                delete codes[tnamespace][key];
                if (Object.keys(codes[tnamespace]).length === 0) {
                    delete codes[tnamespace];
                }
                return str + aciprefix + "removed " + tnamespace + namespaceOperator + key + "\n" + remainingSource;
            }
            return str + aciprefix + "not exist key\n" + remainingSource;
        },
        list : (words, remainingSource) => {
            let str = restructureWords(words, aciprefix) + "\n";
            if(true) {
                str += aciprefix + "saved keys: ";
                for(let i in codes){
                    str += i + " [";
                    for(let j in codes[i]){
                        str += " " + j + ",";
                    }
                    str = str.replace(/,$/, "");
                    str += " ], ";
                }
                str = str.replace(/, $/, "\n");
            } else {
                str += aciprefix + "no saved keys found\n";
            }
            str += remainingSource;
            return str;
        },
        help : (words, remainingSource) => {
            let str = restructureWords(words, aciprefix) + "\n";
            if (unsafeWindow.LANG == "en") {
                str += aciprefix + "Available commands:\n";
                str += aciprefix + "save [key]       - Save code under the specified key\n";
                str += aciprefix + "insert [key]     - Insert code stored under the specified key\n";
                str += aciprefix + "remove [key]     - Remove code under the specified key\n";
                str += aciprefix + "namespace [key]  - Set or switch to the specified namespace\n";
                str += aciprefix + "list             - Display the list of saved keys\n";
                str += aciprefix + "help             - Show this help message\n";
            } else {
                str += aciprefix + "利用可能なコマンド一覧:\n";
                str += aciprefix + "save [key]       - 指定したキーでコードを保存\n";
                str += aciprefix + "insert [key]     - 指定したキーのコードを挿入\n";
                str += aciprefix + "remove [key]     - 指定したキーのコードを削除\n";
                str += aciprefix + "namespace [key]  - 名前空間の設定\n"
                str += aciprefix + "list             - 保存されたキー一覧を表示\n";
                str += aciprefix + "help             - このヘルプを表示\n";
            }
            return str;
        },
        other : (words, remainingSource) => {
            let str = restructureWords(words, aciprefix) + "\n";
            str += aciprefix + "undefined command\n";
            str += remainingSource;
            return str;
        }
    }

    codes = getCodes();
    let spsource = source.split(/\/\/[ \t]*@aci[ \t]+/i);

    let result = spsource[0];

    for(let i = 1; i < spsource.length; i++){
        let words = [];
        let wordMatches = spsource[i].match(/([\w+#]+|\n|::)/g);
        if (wordMatches) {
            words = wordMatches;
        }
        spsource[i] = removeFirstLine(spsource[i]);
        if (words.length > 0 && process[words[0]]) {
            result += process[words[0]](words, spsource[i]);
        } else {
            result += process.other(words, spsource[i]);
        }
    }
    setCode();
    return result;
}


function removeFirstLine(str) {
    let lines = str.split("\n");
    lines.shift();
    return lines.join("\n");
}

function getSource(){
    const docqs = unsafeWindow.document.querySelector.bind(unsafeWindow.document);
    if (typeof unsafeWindow.ace !== "undefined") {
        // ACEエディタの場合、#editor 要素に対応するエディタの内容を取得
        const aceEditor = unsafeWindow.ace.edit(docqs("#editor"));
        return aceEditor.getValue();
    } else {
        // ACEエディタが見つからない場合、代替としてプレーンテキストエリアの内容を取得
        const plainTextarea = docqs("#plain-textarea");
        if (plainTextarea) {
            return plainTextarea.value;
        } else {
            console.error("エディタが見つかりません");
            return null;
        }
    }
}

function setSource(source) {
    const docqs = unsafeWindow.document.querySelector.bind(unsafeWindow.document);
    if (typeof unsafeWindow.ace != "undefined") {
        let aceEditor = unsafeWindow.ace.edit(docqs("#editor"));
        aceEditor.setValue(source);
        docqs("#plain-textarea").value = source;
        aceEditor.focus();
    } else {
        let plainTextarea = docqs("#plain-textarea");
        plainTextarea.value = source;
        plainTextarea.focus();
    }
}

