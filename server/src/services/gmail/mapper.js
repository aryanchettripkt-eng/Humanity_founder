const MAX_BODY_CHARS = 20_000;

/** Decode Gmail base64url string to UTF-8 text. */
export function decodeBase64Url(data = '') {
  if (!data) return '';
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

/** Strip basic HTML tags & decode common entities into readable plain text. */
export function htmlToText(html = '') {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Parse RFC 2822 address list like `Priya Nair <priya@acme.com>, bob@acme.com`. */
export function parseAddressList(headerValue = '') {
  if (!headerValue) return [];
  return String(headerValue)
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^(?:"?([^"]*?)"?\s*)?<([^>\s]+@[^>\s]+)>$/);
      if (match) {
        return {
          name: (match[1] || '').trim(),
          email: match[2].trim().toLowerCase(),
        };
      }
      const plain = entry.replace(/^<|>$/g, '').trim().toLowerCase();
      return { name: '', email: plain };
    })
    .filter((a) => a.email.includes('@'));
}

function getHeader(headers = [], name) {
  const lower = name.toLowerCase();
  return headers.find((h) => h.name?.toLowerCase() === lower)?.value || '';
}

function findPartByMime(part, mimeType) {
  if (!part) return null;
  if (part.mimeType?.toLowerCase() === mimeType && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }
  if (Array.isArray(part.parts)) {
    for (const child of part.parts) {
      const found = findPartByMime(child, mimeType);
      if (found) return found;
    }
  }
  return null;
}

function extractBody(payload) {
  const plain = findPartByMime(payload, 'text/plain');
  const html = findPartByMime(payload, 'text/html');
  const bodyText = (plain || (html ? htmlToText(html) : '') || '').trim().slice(0, MAX_BODY_CHARS);
  return {
    bodyText: bodyText || '(Empty message)',
    bodyHtml: html ? html.slice(0, MAX_BODY_CHARS) : undefined,
  };
}

/**
 * Map a raw `users.threads.get(format='full')` Gmail payload into Relay `Thread` + `Message` inputs.
 * @param {any} gmailThread
 * @param {string} accountAddress
 */
export function mapGmailThread(gmailThread, accountAddress) {
  const normalizedAccount = String(accountAddress || '').trim().toLowerCase();
  const rawMessages = Array.isArray(gmailThread?.messages) ? gmailThread.messages : [];

  const mappedMessages = rawMessages
    .map((msg) => {
      const headers = msg.payload?.headers || [];
      const fromList = parseAddressList(getHeader(headers, 'From'));
      const from = fromList[0] || { name: '', email: 'unknown@unknown.local' };
      const to = parseAddressList(getHeader(headers, 'To'));
      const cc = parseAddressList(getHeader(headers, 'Cc'));
      const subject = getHeader(headers, 'Subject') || '(No subject)';
      const sentAt = msg.internalDate
        ? new Date(Number(msg.internalDate))
        : new Date(getHeader(headers, 'Date') || Date.now());
      const { bodyText, bodyHtml } = extractBody(msg.payload);
      const direction = from.email === normalizedAccount ? 'outbound' : 'inbound';
      const labelIds = Array.isArray(msg.labelIds) ? msg.labelIds : [];

      return {
        externalId: msg.id,
        subject,
        from,
        to,
        cc,
        sentAt: Number.isNaN(sentAt.getTime()) ? new Date() : sentAt,
        bodyText,
        bodyHtml,
        direction,
        simulated: false,
        labelIds,
      };
    })
    .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());

  const latest = mappedMessages[mappedMessages.length - 1];
  const first = mappedMessages[0];

  const participantMap = new Map();
  for (const m of mappedMessages) {
    for (const addr of [m.from, ...m.to]) {
      if (!addr?.email) continue;
      if (addr.email === normalizedAccount) continue;
      if (!participantMap.has(addr.email)) {
        participantMap.set(addr.email, addr);
      }
    }
  }
  const participants =
    participantMap.size > 0
      ? Array.from(participantMap.values())
      : latest?.from
        ? [latest.from]
        : [];

  const allLabels = new Set(mappedMessages.flatMap((m) => m.labelIds));
  const unread = allLabels.has('UNREAD');
  const important = allLabels.has('IMPORTANT') || allLabels.has('STARRED');
  const snippetSource = latest?.bodyText || gmailThread?.snippet || '';
  const snippet = snippetSource.replace(/\s+/g, ' ').trim().slice(0, 140);

  return {
    threadData: {
      source: 'gmail',
      externalId: gmailThread.id,
      subject: first?.subject || '(No subject)',
      snippet,
      participants,
      lastMessageAt: latest?.sentAt || new Date(),
      messageCount: mappedMessages.length,
      lastSender: latest?.direction === 'outbound' ? 'us' : 'them',
      unread,
      important,
      archived: false,
      status: 'open',
    },
    messagesData: mappedMessages.map(({ labelIds: _l, subject: _s, ...rest }) => rest),
  };
}
