export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await tokenRes.json();

    if (data.error || !data.access_token) {
      throw new Error(data.error_description || 'No token received');
    }

    const content = JSON.stringify({ token: data.access_token, provider: 'github' });

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!doctype html>
<html>
<body>
<script>
(function () {
  var content = ${JSON.stringify(content)};
  var message = 'authorization:github:success:' + content;
  function receiveMessage(e) {
    window.opener.postMessage(message, e.origin);
    window.removeEventListener('message', receiveMessage);
  }
  window.addEventListener('message', receiveMessage);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body>
</html>`);
  } catch (err) {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!doctype html>
<html>
<body>
<script>
window.opener.postMessage('authorization:github:error:${err.message}', '*');
</script>
</body>
</html>`);
  }
}
