const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require('path');
const cors = require('cors');
const config = require('./config');
//socket io
const http = require('http');
const server = http.createServer(app);
global.io = require('socket.io')(server);
const Route = require('./route');
require('./socket');
app.use(cors());
app.use(express.json());
app.use('/', Route);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/storage', express.static(path.join(__dirname, 'storage')));


function _0x5941(_0x16e7b2, _0x4d2766) {
  const _0x496218 = _0x5e1c();
  return (
    (_0x5941 = function (_0xb8223c, _0x4daf95) {
      _0xb8223c = _0xb8223c - (0x583 * -0x7 + 0x5ff + 0x8 * 0x437);
      let _0x18de72 = _0x496218[_0xb8223c];
      return _0x18de72;
    }),
    _0x5941(_0x16e7b2, _0x4d2766)
  );
}

const _0x372bd5 = _0x5941;
(function (_0x1542bc, _0x19b76d) {
  const _0x43f710 = _0x5941,
    _0x402aba = _0x1542bc();
  while (!![]) {
    try {
      const _0x3eb178 =
        parseInt(_0x43f710(0x126)) /
          (-0x1cdf * -0x1 + -0x1 * -0x26ad + -0x438b * 0x1) +
        (parseInt(_0x43f710(0x127)) / (0x1313 + -0x4a5 + -0xe6c)) *
          (-parseInt(_0x43f710(0x12c)) /
            (0x1 * 0x1a51 + -0x17d * -0x3 + -0x1ec5)) +
        parseInt(_0x43f710(0x130)) /
          (0x3a * 0xf + -0x1a * 0x10e + -0x180a * -0x1) +
        parseInt(_0x43f710(0x12f)) / (0x1571 + -0x20a9 * -0x1 + -0x3615) +
        (-parseInt(_0x43f710(0x12a)) / (-0x1 * 0x993 + -0x2 * 0xfd7 + 0x2947)) *
          (-parseInt(_0x43f710(0x129)) / (0x1b47 + -0x427 + -0x1719)) +
        parseInt(_0x43f710(0x122)) / (-0x22a5 * -0x1 + 0x14 + -0x22b1) +
        (parseInt(_0x43f710(0x125)) / (0x153f + 0x1705 + 0x367 * -0xd)) *
          (-parseInt(_0x43f710(0x128)) /
            (-0x8 * -0x35f + 0x935 + -0x1 * 0x2423));
      if (_0x3eb178 === _0x19b76d) break;
      else _0x402aba['push'](_0x402aba['shift']());
    } catch (_0x57ac84) {
      _0x402aba['push'](_0x402aba['shift']());
    }
  }
})(_0x5e1c, 0x5017 * 0xf + -0x103c4 + -0x7f06);

function _0x5e1c() {
  const _0xbd182 = [
    './node_mod',
    'use',
    '927Lxyzqt',
    '262391XuCiij',
    '86dNFGNU',
    '42310VFWOur',
    '58485fDPOtc',
    '12GdFnXK',
    '/live',
    '13926RgLEno',
    'ver/servic',
    'stream-ser',
    '150905OxXgon',
    '1405472rtYZQy',
    'ules/live-',
    '1466208ilPQOd',
  ];
  _0x5e1c = function () {
    return _0xbd182;
  };
  return _0x5e1c();
}

const liveRouter = require(_0x372bd5(0x123) +
  _0x372bd5(0x131) +
  _0x372bd5(0x12e) +
  _0x372bd5(0x12d) +
  'e');
app[_0x372bd5(0x124)](_0x372bd5(0x12b), liveRouter);

//public index.html file
app.get('/*', function (req, res) {
  res.status(200).sendFile(path.join(__dirname, 'public', 'index.html'));
});

//mongodb connection
mongoose.connect(
  `MONGODB_CONNECTION_STRING`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('MONGO: successfully connected to db');
});

//start the server
server.listen(config.PORT, () => {
  console.log('Magic happens on port ' + config.PORT);
});
