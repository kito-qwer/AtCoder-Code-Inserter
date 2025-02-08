// ==UserScript==
// @name         AtCoder Code Inserter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  AtCoderのコードエディタに登録したコードを挿入する
// @author       Qvito
// @match        https://atcoder.jp/contests/*/custom_test*
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    const lang = unsafeWindow.LANG == "en" ? 0 : 1;

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

function aciProcess(source){
    let aciprefix = "// aci| ";
    let process = {
        insert : (words, remainingSource) => {
            // console.log(words);
            let str = restructureWords(words, aciprefix) + "\n";
            let tmp = localStorage.getItem("ACI_" + words[1]);
            if(tmp != null){
                str += tmp;
                str += aciprefix + "inserted " + words[1] + "\n";
            }
            else str += aciprefix + "not exist code\n";
            str += remainingSource;
            return str;
        },
        save : (words, remainingSource) => {
            // console.log(words);
            let str = restructureWords(words, aciprefix) + "\n";
            if(words[1]){
                localStorage.setItem("ACI_" + words[1], remainingSource.trim().replace(/\n+/g, "\n") + "\n");
                return str + aciprefix + "saved " + words[1] + "\n" + remainingSource;
            }
            return str + aciprefix + "not exist key\n" + remainingSource;
        },
        list : (words, remainingSource) => {
            let str = restructureWords(words, aciprefix) + "\n";
            let keys = [];
            for (let i = 0; i < localStorage.length; i++){
                let key = localStorage.key(i);
                if(key.indexOf("ACI_") === 0){
                    keys.push(key.substring(4));
                }
            }
            if(keys.length > 0) {
                str += aciprefix + "saved keys: " + keys.join(", ") + "\n";
            } else {
                str += aciprefix + "no saved keys found\n";
            }
            str += remainingSource;
            return str;
        },
        remove : (words, remainingSource) => {
            let str = restructureWords(words, aciprefix) + "\n";
            if(words[1]){
                localStorage.removeItem("ACI_" + words[1]);
                return str + aciprefix + "removed " + words[1] + "\n" + remainingSource;
            }
            return str + aciprefix + "not exist key\n" + remainingSource;
        },
        help : (words, remainingSource) => {
            let str = restructureWords(words, aciprefix) + "\n";
            if (unsafeWindow.LANG == "en") {
                str += aciprefix + "Available commands:\n";
                str += aciprefix + "save [key]   - Save code under the specified key\n";
                str += aciprefix + "insert [key] - Insert code stored under the specified key\n";
                str += aciprefix + "remove [key] - Remove code under the specified key\n";
                str += aciprefix + "list         - Display the list of saved keys\n";
                str += aciprefix + "help         - Show this help message\n";
            } else {
                str += aciprefix + "利用可能なコマンド一覧:\n";
                str += aciprefix + "save [key]   - 指定したキーにコードを保存\n";
                str += aciprefix + "insert [key] - 指定したキーのコードを挿入\n";
                str += aciprefix + "remove [key] - 指定したキーのコードを削除\n";
                str += aciprefix + "list         - 保存されたキー一覧を表示\n";
                str += aciprefix + "help         - このヘルプを表示\n";
            }
            return str;
        },
        other : (words, remainingSource) => {
            // console.log(words);
            let str = restructureWords(words, aciprefix) + "\n";
            str += aciprefix + "undefined command\n";
            str += remainingSource;
            return str;
        }
    }

    let spsource = source.split(/\/\/[ \t]*@aci[ \t]+/i);
    // console.log(spsource);

    let result = spsource[0];

    for(let i = 1; i < spsource.length; i++){
        let words = [];
        let wordMatches = spsource[i].match(/(\w+|\n)/g);
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
    return result;
}

function restructureWords(words, aciprefix){
    let str = aciprefix + ">";
    for(let i = 0; i < words.length && words[i] != "\n"; i++){
        str += " " + words[i];
    }
    return str;
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

