import serveHTMLModule from './serveHTMLModule.js';
import serveJavaScriptModule from './serveJavaScriptModule.js';

export default function serveModule(req, res, next) {
  const { contentType } = req.entry;
  if (
    contentType === 'application/javascript' ||
    contentType === 'text/x-typescript'
  ) {
    return serveJavaScriptModule(req, res);
  }

  if (contentType === 'text/html') {
    return serveHTMLModule(req, res);
  }

  next();
}
