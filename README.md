# kokkoro-plugin-rsshub
> Everything is RSSible

## 安装

``` shell
# 切换至 bot 目录
cd bot

# 安装 npm 包
npm i kokkoro-plugin-rsshub
```

在 [kokkoro](https://github.com/kokkorojs/kokkoro) 成功运行并登录后，发送 `enable rsshub` 即可为 bot 启用插件  
使用 `rsshub update <key> <value>` 可修改当前群聊的插件参数，例如关闭群内消息订阅 `rsshub update auto_send false` 可简写 `close rsshub`

## 参数

``` typescript
interface RSSHubOption {

}
```
