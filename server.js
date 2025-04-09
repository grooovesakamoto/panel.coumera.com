const http = require('http');
const { parse } = require('url');
const next = require('next');

// 環境変数の設定
const port = parseInt(process.env.PORT || '8080', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';

console.log(`Server starting with config: dev=${dev}, hostname=${hostname}, port=${port}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set'}`);

// Next.jsアプリケーションを初期化
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// アプリケーションの準備（ルートハンドラなど）
app.prepare()
  .then(() => {
    // HTTPサーバーの作成
    console.log('Creating HTTP server...');
    const server = http.createServer((req, res) => {
      try {
        // URLパース
        const parsedUrl = parse(req.url, true);
        console.log(`${req.method} ${req.url}`);
        
        // リクエストをNext.jsハンドラに渡す
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // エラーハンドリング
    server.on('error', (err) => {
      console.error('Server error:', err);
    });

    // サーバーの起動
    server.listen(port, hostname, () => {
      console.log(`> Server listening on http://${hostname}:${port}`);
    });

    // シグナルハンドリング
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error('Error during app preparation:', err);
    process.exit(1);
  }); 