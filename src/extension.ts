import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// 状态栏相关变量
let txtLines: string[] = [];
let currentLineIndex = 0;
let statusBarItem: vscode.StatusBarItem;
let isFunctionEnabled = false;
let mouseDownLine: number | null = null;
const MAX_STATUS_BAR_LENGTH = 50;
let fileFullPath = 'D:\\txt2\\duchu.txt';

// 活动栏相关类
class ConfigInfoProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    console.log('getChildren method is called'); // 添加调试日志

    const item4 = new vscode.TreeItem(`Setting`);
    item4.command = {
      command: 'extension.myView.setting',
      title: 'Transfer Inputs',
      arguments: []
    };
    const item3 = new vscode.TreeItem(`PreviousLine`);
    item3.command = {
      command: 'extension.myStatusBar.previousLine',
      title: 'Transfer Inputs',
      arguments: []
    };
    const item2 = new vscode.TreeItem(`NextLine`);
    item2.command = {
      command: 'extension.myStatusBar.nextLine',
      title: 'Transfer Inputs',
      arguments: []
    };

    
    return Promise.resolve([item4, item3, item2]);

  }
}


// 显示下一行内容的函数
function showNextLine() {
  if (txtLines.length === 0) {
    return;
  }
  currentLineIndex++;
  //currentLineIndex = (currentLineIndex + 1) % txtLines.length;
  statusBarItem.text = txtLines[currentLineIndex];
  statusBarItem.tooltip = txtLines[currentLineIndex];
}

// 显示上一行内容的函数
function previousLine() {
  if (txtLines.length === 0) {
    return;
  }
  currentLineIndex--;
  //currentLineIndex = (currentLineIndex - 1 + txtLines.length) % txtLines.length;
  statusBarItem.text = txtLines[currentLineIndex];
  statusBarItem.tooltip = txtLines[currentLineIndex];
}

// 启用上下切换功能
function nextLine() {
  isFunctionEnabled = true;

  if (isFunctionEnabled == true) {
    showNextLine();
  }
}

// 禁用上下切换功能
// function disableLineSwitch() {
//   isFunctionEnabled = false;
//   mouseDownLine = null;
// }


function readFile() {
  const txtFilePath = path.join(fileFullPath);
  if (fs.existsSync(txtFilePath)) {
    try {
      const content = fs.readFileSync(txtFilePath, 'utf8');
      txtLines = content
        .split('\n')
        .map((line, index) => `${index}. ${line}`)
        .filter(line => line.trim() !== '');;

    } catch (error) {
      vscode.window.showErrorMessage(`读取 TXT 文件时出错: ${error}`);
    }
  } else {
    vscode.window.showInformationMessage('未找到指定的 TXT 文件。');
  }
}

function getWebviewContent(webview: vscode.Webview) {
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Webview Input Example</title>
        </head>
        <body>
           <div><label>BookDir：</label><input type="text" id="fileFullPath" value="">
           <input type="button" id="switchBookBtn" value="switchBook"></div>

           <div><label>CurrentRow：</label><input type="text" id="currentLineIndex" value="">
           <input type="button" id="switchIndexBtn" value="switchLine"></div>
            

            <script>
                const vscode = acquireVsCodeApi();

                const switchBookBtn = document.getElementById('switchBookBtn');
                switchBookBtn.addEventListener('click', () => {
                    const fileFullPath = document.getElementById('fileFullPath');
             
                    vscode.postMessage({
                        command: 'switchBookBtn',
                        value:fileFullPath.value
                    });
                });

                const switchIndexBtn = document.getElementById('switchIndexBtn');
                switchIndexBtn.addEventListener('click', () => {
                   
                    const currentLineIndex = document.getElementById('currentLineIndex');
                    
                    vscode.postMessage({
                        command: 'switchIndexBtn',
                        value: currentLineIndex.value
                    });
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'updateFileFullPath':
                          
                            const textbox = document.getElementById('fileFullPath');
                            textbox.value = message.text;
                            break;
                    }
                });
            </script>
        </body>
        </html>
    `;
}
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.myView.setting', () => {
    const panel = vscode.window.createWebviewPanel(
      'webviewInputExample',
      'setting',
      vscode.ViewColumn.One,
      {
        enableScripts: true
      }
    );

    panel.webview.html = getWebviewContent(panel.webview);

    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'switchBookBtn':
            // 处理按钮点击事件
            var value = message.value;
            if (value && fs.existsSync(value)) {
              fileFullPath = value;
              currentLineIndex = 0;
              readFile();
            }
            break;
          case 'switchIndexBtn':
            // 处理按钮点击事件
            var index = message.value;
            if (index && Number(index) >= 0) {
              currentLineIndex = Number(index) - 1;
              vscode.commands.executeCommand('extension.myStatusBar.nextLine');
            }

            // var index = message.value;
            // if (index && Number(index) >= 0) {
            //   currentLineIndex = Number(index) - 1;
            //   vscode.commands.executeCommand('extension.myStatusBar.nextLine');

            //   //const newText = 'Button clicked! New text assigned.';
            //   //panel.webview.postMessage({ command: 'updateFileFullPath', text: newText });
            // }
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    panel.webview.postMessage({ command: 'updateFileFullPath', text: fileFullPath });
  });


  // const nextLine = vscode.commands.registerCommand('extension.myView.nextLine', () => {
  //   vscode.commands.executeCommand('extension.myStatusBar.enableLineSwitch');
  // });

  context.subscriptions.push(disposable);
  
  //-----------------------------------------------------------
  // 活动栏部分
  const configInfoProvider = new ConfigInfoProvider();
  vscode.window.registerTreeDataProvider('extension.myView', configInfoProvider);


  // vscode.window.onDidChangeActiveTextEditor(() => {
  //   configInfoProvider.refresh();
  // });

  // vscode.window.onDidChangeTextEditorSelection(() => {
  //   configInfoProvider.refresh();
  // });

  // const showTransfer = vscode.commands.registerCommand('extension.myView.showTransfer', async () => {
  //   const input = await vscode.window.showInputBox({
  //     prompt: '请输入跳转行',
  //     placeHolder: '数字：0，1，2 等等'
  //   });
  //   if (input && Number(input)>=0) {
  //     currentLineIndex = Number(input) - 1;
  //     vscode.commands.executeCommand('extension.myStatusBar.enableLineSwitch');
  //     configInfoProvider.refresh();
  //   }
  // });
  // const showFileFullPath = vscode.commands.registerCommand('extension.myView.showFileFullPath', async () => {
  //   const input = await vscode.window.showInputBox({
  //     prompt: '请输入书籍全路径',
  //     placeHolder: 'D:\\txt\\示例地址.txt'
  //   });
  //   if (input && fs.existsSync(input)) {
  //     fileFullPath = input + "";
  //     currentLineIndex = 0;
  //     readFile();
  //     configInfoProvider.refresh();
  //   }
  // });

  // context.subscriptions.push(showTransfer, showFileFullPath);

  //-----------------------------------------------------------
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  statusBarItem.show();
  statusBarItem.command = 'extension.myStatusBar.nextLine';

  const nextLineCommand = vscode.commands.registerCommand('extension.myStatusBar.nextLine', () => {
    nextLine();
    //configInfoProvider.refresh();
  });
  const previousLineCommand = vscode.commands.registerCommand('extension.myStatusBar.previousLine', () => {
    previousLine();
    //configInfoProvider.refresh();
  });
  // const globalClickDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
  //   disableLineSwitch();
  // });

  context.subscriptions.push(statusBarItem, nextLineCommand, previousLineCommand);




  //-----------------------------------------------------------
  readFile();
  if (txtLines.length > 0) {
    statusBarItem.text = txtLines[currentLineIndex];
    statusBarItem.tooltip = txtLines[currentLineIndex];
  }

}


export function deactivate() { }


