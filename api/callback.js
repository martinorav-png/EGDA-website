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

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!doctype html>
<html>
<body>
<script>
(function () {
  var token = ${JSON.stringify(data.access_token)};
  var message = 'authorization:github:success:' + JSON.stringify({ token: token, provider: 'github' });
  if (window.opener) {
    window.opener.postMessage(message, '*');
    setTimeout(function () { window.close(); }, 500);
  }
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
if (window.opener) {
  window.opener.postMessage('authorization:github:error:' + ${JSON.stringify(err.message)}, '*');
}
setTimeout(function () { window.close(); }, 500);
</script>
</body>
</html>`);
  }
}
