import http from 'node:http';

const port = 5080;

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
