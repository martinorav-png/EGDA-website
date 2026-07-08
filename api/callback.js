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
<p id="s" style="font-family:monospace;padding:1rem;">Token received. Sending to CMS...</p>
<script>
(function () {
  var s = document.getElementById('s');
  var token = ${JSON.stringify(data.access_token)};
  var message = 'authorization:github:success:' + token;
  if (window.opener) {
    s.textContent = 'Opener found. Sending message...';
    window.opener.postMessage(message, '*');
    s.textContent = 'Message sent. Closing in 2s...';
    setTimeout(function () { window.close(); }, 2000);
  } else {
    s.textContent = 'ERROR: window.opener is null — popup lost its parent reference.';
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
<p style="font-family:monospace;padding:1rem;color:red;">ERROR: ${err.message}</p>
</body>
</html>`);
  }
}
