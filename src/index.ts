import { Plugin, Option, getBotList } from 'kokkoro';

interface RSSHubOption extends Option {

}

const option: RSSHubOption = {
  apply: true,
  lock: false,
};
export const plugin = new Plugin('rsshub', option).version(require('../package.json').version);

plugin
  .command('subscribe <url>')
  .description('添加 RSS 订阅')
  .sugar(/^订阅\s?(?<url>https?:\/\/[^\s]*)$/)
  .action(function (url: string) {

  });

plugin
  .command('send', 'group')
  .description('发送 rss 订阅信息')
  .sugar(/^$/)
  .action(function () {

  });

// 定时发送
plugin
  .schedule('0 0/5 * * * ?', async () => {
    // const bot_list = getBotList();

    // for (const [_, bot] of bot_list) {
    //   const group_list = bot.getGroupList();

    //   // 判断开启服务的群
    //   group_list.forEach(async group => {
    //     const { group_id } = group;
    //     const { apply } = bot.getOption(group_id, 'rsshub') as RSSHubOption;

    //     if (apply) {
    //       bot.sendGroupMsg(group_id, '');
    //     }
    //   })
    // }
  })
  // 定时更新
  .schedule('0 0/10 * * * ?', async () => {

  })
