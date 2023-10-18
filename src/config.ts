import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://blog.hackerchai.com/", // replace this with your deployed domain
  author: "Eason Chai",
  desc: "Blog focusing on Backend Dev, Cloud Native, and more.",
  title: "Hackerchai's Dev Blog",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerPage: 3,
};

export const LOCALE = ["zh-CN"]; // set to [] to use the environment default

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/satnaing/astro-paper",
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
