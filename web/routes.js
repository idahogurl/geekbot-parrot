const express = require('express');
const Geekbot = require('../Geekbot');
const router = express.Router();

/* GET home page. */
router.get('/', function(_, res) {
  res.render('index');
});

function transformData(data) {
  return data.map((item, i) => {
    return { value: i, label: item };
  });
}

router.get('/api', async function(_, res) {
  const geekbot = new Geekbot(
    'idahogurl',
    ['healthline', 'idahogurl'],
    'yesterday'
  );

  const yesterday = await geekbot.getWhatDidYouDo();
  const today = await geekbot.getWhatWillYouDo();
  res.send({
    yesterday: transformData(yesterday),
    today: transformData(today)
  });
});

module.exports = router;
