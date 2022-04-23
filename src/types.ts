declare module 'rsshub' {
  function init(config: config): void;
  function request(url: string): Promise<RSS>;
}

interface RSS {
  lastBuildDate: string;
  updated: string;
  ttl: number;
  atomlink: string;
  title: string;
  link: string;
  description: string;
  lastSendLink: string;
  item: RSSItem[];
}

interface RSSItem {
  title: string;
  description: string;
  pubDate: string;
  link: string;
}

interface config {
  // 日志配置
  DEBUG_INFO?: boolean;            // 是否在首页显示路由信息，默认 true
  LOGGER_LEVEL?: number;           // 指明输出到 console 和日志文件的日志的最大等级，默认 info
  NO_LOGFILES?: boolean;           // 是否禁用日志文件输出，默认 false
  SENTRY?: string;                 // Sentry dsn，用于错误追踪
  SENTRY_ROUTE_TIMEOUT?: number;   // 路由耗时超过此毫秒值上报 Sentry，默认 3000

  /**
   * TODO ⎛⎝≥⏝⏝≤⎛⎝ 还有很多没写
   * https://docs.rsshub.app/install/#pei-zhi
   */
}

// 订阅配置
interface Subscribe {
  [group_id: number]: {
    // 群名称
    group_name: string;
    // 群订阅列表
    rss_list: string[];
  }
}
