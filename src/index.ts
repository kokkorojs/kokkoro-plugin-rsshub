import { readFile } from 'fs/promises';
import { Plugin, Option, getBotList, logger, Bot } from 'kokkoro';
import { getAllRSS, getRSS, addRSS, setRSS, hasRSS, initSubscribe, getSubscribe, writeSubscribe } from './service';

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
  .sugar(/^添加\s?(?<url>https?:\/\/[^\s]*)$/)
  .action(function (url: string) {
    if (hasRSS(url)) {
      this.event.reply('已存在这条 RSS 订阅，不要重复添加');
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
  .command('subscribe', 'group')
  .description('订阅 RSS 并开启群聊监听')
  .sugar(/^订阅\s?(?<url>https?:\/\/[^\s]*)$/)
  .action(function (url: string) {
    const { uin } = this.bot;
    const { group_id, group_name } = this.event;

    getSubscribe(uin)
      .then(async subscribe => {
        const { subscribe_list } = subscribe[group_id];

        if (subscribe_list.includes(url)) {
          return this.event.reply('当前群聊已存在该 RSS 信息，不要重复订阅');
        }
        subscribe_list.push(url);
        try {
          const rewrite = await writeSubscribe(uin);
          if (rewrite) {
            this.bot.logger.mark('已更新 subscribe.yml');
          }
        } catch (error) {
          this.bot.logger.error(`更新写入 subscribe.yml 失败，${(error as Error).message}`);
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
  .schedule('0 0/5 * * * ?', async () => {
    const bot_list = getBotList();

    for (const [_, bot] of bot_list) {
      const group_list = bot.getGroupList();

      // 判断开启服务的群
      group_list.forEach(async group => {
        const { group_id } = group;
        const { apply } = bot.getOption(group_id, 'rsshub') as RSSHubOption;

        // if (apply) {
        //   bot.sendGroupMsg(group_id, '');
        // }
      })
    }
  })
  // 定时更新
  .schedule('0 0/10 * * * ?', async () => {
    const rss_urls = getAllRSS();
    const rss_urls_length = rss_urls.length;

    logger.mark('开始更新 RSS 数据');

    for (let i = 0; i < rss_urls_length; i++) {
      const url = rss_urls[i];

      await getRSS(url)
        .then(async rss => {
          rss.lastSendLink = '';
          await setRSS(url, rss);
          logger.info(`RSS: ${url} 更新成功`);
        })
        .catch(error => {
          logger.error(`RSS: ${url} 更新失败，${error.message}`);
        })
    }
    logger.mark('所有 RSS 更新完毕');
  })
