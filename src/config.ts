import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://blog.hackerchai.com/", // replace this with your deployed domain
  author: "Eason Chai",
  desc: "Free Software, Free Society.",
  title: "Hackerchai's Dev Blog",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerPage: 3,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
};

export const LOCALE = {
  lang: "zh", // html lang code. Set this empty and default will be "en"
  langTag: ["zh-CN"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/hackerchai",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:i@hackerchai.com",
    linkTitle: `Send an email to ${SITE.title}`,
    active: true,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/hackerchaiX",
    linkTitle: `${SITE.title} on Twitter`,
    active: true,
  },
  {
    name: "Steam",
    href: "https://steamcommunity.com/id/http404unavailable/",
    linkTitle: `${SITE.title} on Steam`,
    active: true,
  },
  {
    name: "Telegram",
    href: "https:/t.me/hackerchai",
    linkTitle: `${SITE.title} on Telegram`,
    active: true,
  },
  {
    name: "Mastodon",
    href: "https://sn.angry.im/@hackerchai",
    linkTitle: `${SITE.title} on Mastodon`,
    active: true,
  },
];
