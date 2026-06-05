function node(id) {
  return document.getElementById(id);
}

function setStatus(id, message, isError = false) {
  const el = node(id);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('auth-status-error', isError);
}

function getDraftId() {
  const url = new URL(window.location.href);
  return (url.searchParams.get('draftId') || '').trim();
}

function signInUrl() {
  const redirect = encodeURIComponent(window.location.href);
  return `/.auth/login/aad?post_login_redirect_uri=${redirect}`;
}

async function getPrincipal() {
  const response = await fetch('/.auth/me', { credentials: 'include' });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const principal = payload?.clientPrincipal || null;
  return principal;
}

async function finalizePublish(draftId) {
  const response = await fetch('/api/race-admin/excelPublishFinalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ draftId })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Publish failed (${response.status})`);
  }

  return payload;
}

document.addEventListener('DOMContentLoaded', async () => {
  const draftId = getDraftId();
  const signInLink = node('publishSignInLink');
  const finalizeBtn = node('publishFinalizeBtn');
  const viewBtn = node('publishViewBtn');

  if (!draftId) {
    setStatus('publishAuthStatus', 'Missing draftId in URL. Open this page from the Excel Publish button.', true);
    return;
  }

  setStatus('publishDraftStatus', `Draft ID: ${draftId}`);

  if (signInLink) {
    signInLink.href = signInUrl();
  }

  try {
    const principal = await getPrincipal();
    const email = String(principal?.userDetails || '').toLowerCase();
    if (!principal || !email.endsWith('@nomadcyclingclub.com')) {
      setStatus('publishAuthStatus', 'Please sign in with your nomadcyclingclub.com account to publish.', true);
      if (signInLink) signInLink.hidden = false;
      return;
    }

    setStatus('publishAuthStatus', `Signed in as ${email}. Ready to publish.`);
    if (finalizeBtn) finalizeBtn.hidden = false;

    finalizeBtn?.addEventListener('click', async () => {
      finalizeBtn.disabled = true;
      setStatus('publishAuthStatus', 'Publishing results...');
      try {
        const result = await finalizePublish(draftId);
        setStatus('publishAuthStatus', `Published successfully by ${result.publishedBy}.`);
        if (viewBtn) viewBtn.hidden = false;
      } catch (error) {
        setStatus('publishAuthStatus', error.message || 'Publish failed.', true);
      } finally {
        finalizeBtn.disabled = false;
      }
    });
  } catch (error) {
    setStatus('publishAuthStatus', error.message || 'Unable to check authentication.', true);
    if (signInLink) signInLink.hidden = false;
  }
});
