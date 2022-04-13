import RSSHub from 'rsshub';

RSSHub.init({
  // config
});

RSSHub.request('/bilibili/bangumi/media/9192')
  .then((data) => {
    console.log(data);
  })
  .catch((e) => {
    console.log(e);
  });
