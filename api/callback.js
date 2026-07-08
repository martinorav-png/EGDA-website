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
<p id="s" style="font-family:monospace;padding:1rem;">Sending auth token...</p>
<script>
(function () {
  var s = document.getElementById('s');
  if (!window.opener) {
    s.textContent = 'ERROR: window.opener is null — popup lost its parent reference.';
    return;
  }
  var payload = JSON.stringify({ token: ${JSON.stringify(data.access_token)}, provider: 'github' });
  // Decap's handshake: the CMS only attaches its token listener after it
  // receives 'authorizing:github' from this window and echoes it back.
  function receiveMessage(e) {
    window.removeEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorization:github:success:' + payload, e.origin);
    s.textContent = 'Token sent to CMS.';
  }
  window.addEventListener('message', receiveMessage, false);
  s.textContent = 'Waiting for CMS handshake...';
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
<p style="font-family:monospace;padding:1rem;color:red;">ERROR: ${err.message}</p>
</body>
</html>`);
  }
}
