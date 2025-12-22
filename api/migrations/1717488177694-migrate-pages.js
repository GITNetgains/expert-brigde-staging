'use strict';
const content =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
const type = 'page';

module.exports.up = async function (next) {
  const pages = [
    {
      title: 'FAQs',
      alias: 'faqs',
      type,
      content
    },
    {
      title: 'Terms of Use',
      alias: 'terms',
      type,
      content
    },
    {
      title: 'Privacy Policy',
      alias: 'privacy-policy',
      type,
      content
    },
    {
      title: 'Refund Policy',
      alias: 'refund-policy',
      type,
      content
    },
    {
      title: 'About us',
      alias: 'about',
      type,
      content
    }
  ];

  for (const item of pages) {
    let page = await DB.Post.findOne({
      alias: item.alias
    });

    if (!page) {
      page = new DB.Post(item);
    } else {
      page = {
        ...page,
        ...item
      };
    }

    await page.save();
  }
  console.log('Mirgate pages success');

  next();
};

module.exports.down = function (next) {
  next();
};
