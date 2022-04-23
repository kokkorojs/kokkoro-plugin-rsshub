import { readFile } from 'fs/promises';
import { Plugin, Option, getBotList, logger, Bot } from 'kokkoro';
import { getAllRSS, getRSS, addRSS, setRSS, hasRSS, initSubscribe, getSubscribe, writeSubscribe, getLastSendLink, getFirstRSS, hasSend } from './service';

interface RSSHubOption extends Option {

}

const option: RSSHubOption = {
  apply: true,
  lock: false,
};
export const plugin = new Plugin('rsshub', option).version(require('../package.json').version);

plugin
  .command('add <url>')
  .description('添加 RSS 订阅')
  .sugar(/^添加订阅\s?(?<url>https?:\/\/[^\s]*)$/)
  .action(function (url: string) {
    if (hasRSS(url)) {
      return this.event.reply('已存在这条 RSS 订阅，不要重复添加');
    }
    addRSS(url)
      .then(() => {
        this.event.reply('添加订阅成功');
      })
      .catch(error => {
        this.event.reply(`添加订阅失败，${error.message}`);
      })
  });

plugin
  .command('sub <url>', 'group')
  .description('订阅 RSS 并开启群聊监听')
  .sugar(/^订阅\s?(?<url>https?:\/\/[^\s]*)$/)
  .action(function (url: string) {
    const { uin } = this.bot;
    const { group_id, group_name } = this.event;

    getSubscribe(uin)
      .then(async subscribe => {
        const { rss_list } = subscribe[group_id];

        if (rss_list.includes(url)) {
          return this.event.reply('当前群聊已存在该 RSS 信息，不要重复订阅');
        }
        rss_list.push(url);
        subscribe[group_id].group_name = group_name;

        try {
          // 如果 RSS 订阅池不存在该条地址则写入
          if (!hasRSS(url)) {
            await addRSS(url);
          }
          const rewrite = await writeSubscribe(uin);

          if (rewrite) {
            this.event.reply('监听订阅成功');
            this.bot.logger.mark(`已更新 rsshub/${uin}.yml`);
          }
        } catch (error) {
          const { message } = error as Error;

          this.event.reply(`监听订阅失败，${message}`);
        }
      })
      .catch(error => {
        this.event.reply(error.message);
      })
  })

plugin
  // 绑定事件
  .onBind((bot: Bot) => {
    initSubscribe(bot);
  })
  // 定时发送
  .schedule('30 0/5 * * * ?', async () => {
    const bot_list = getBotList();
    const all_rss = getAllRSS();
    const rss_urls = Object.keys(all_rss);

    // 遍历 RSS 列表
    for (let i = 0; i < rss_urls.length; i++) {
      const url = rss_urls[i];

      // 遍历 Bot 列表
      for (const [uin, bot] of bot_list) {
        const group_list = bot.getGroupList();

        // 判断开启服务的群
        for (const [_, group] of group_list) {
          const { group_id } = group;
          const { apply } = bot.getOption(group_id, 'rsshub') as RSSHubOption;

          // 获取当前群聊监听的 RSS
          const { rss_list } = (await getSubscribe(uin))[group_id];

          if (apply && rss_list.includes(url) && !hasSend(url)) {
            bot.sendGroupMsg(group_id, getFirstRSS(url));
          }
        }
      }
      // 更新 lastSendLink
      all_rss[url].lastSendLink = all_rss[url].item[0].link;
      // 写入 RSS
      await setRSS(url, all_rss[url]);
    }
  })
  // 定时更新
  .schedule('0 0/10 * * * ?', async () => {
    const rss_urls = Object.keys(getAllRSS());
    const rss_urls_length = rss_urls.length;

    logger.mark('开始更新 RSS 数据');

    for (let i = 0; i < rss_urls_length; i++) {
      const url = rss_urls[i];

      await getRSS(url)
        .then(async rss => {
          // 获取本地 RSS 最后发送的 link
          rss.lastSendLink = getLastSendLink(url);
          await setRSS(url, rss);
          logger.info(`RSS: ${url} 更新成功`);
        })
        .catch(error => {
          logger.error(`RSS: ${url} 更新失败，${error.message}`);
        })
    }
    logger.mark('所有 RSS 更新完毕');
  })
