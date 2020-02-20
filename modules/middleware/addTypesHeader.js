import http from 'http';
import https from 'https';
import path from 'path';
import semver from 'semver';
import getTypesPackageName from '../utils/getTypesPackageName';

const origin = process.env.ORIGIN || 'https://unpkg.com';

const agent = origin.startsWith('http:')
  ? new http.Agent({
      keepAlive: true
    })
  : new https.Agent({
      keepAlive: true
    });

function resolveTypesUrl(url, log) {
  return new Promise((accept, reject) => {
    if (origin.startsWith('http:')) {
      http
        .request(url, { method: 'HEAD', agent }, handleResponse)
        .on('error', reject)
        .end();
    } else {
      https
        .request(url, { method: 'HEAD', agent }, handleResponse)
        .on('error', reject)
        .end();
    }

    function handleResponse(res) {
      const location = res.headers.location;
      if (res.statusCode >= 300 && res.statusCode < 400 && location) {
        const redirectUrl = new URL(location, url).href;
        log.debug(`Following redirect from ${url} to ${redirectUrl}`);
        accept(resolveTypesUrl(redirectUrl));
        return;
      }

      if (res.statusCode === 200) {
        accept(url);
        return;
      }

      reject(
        new Error(
          `Cannot resolve types url from ${url}. Response status code: ${res.statusCode}`
        )
      );
    }
  });
}

// A part of the logic responsible for typings resolution lives in findEntry.js
export default async function addTypesHeader(req, res, next) {
  const { packageName, packageVersion, filename } = req;

  // we shouldn't try to resolve typings for the files
  // that already contain typings in them
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
    next();
    return;
  }

  if (req.localTypingEntries && req.localTypingEntries.length > 0) {
    const topPriorityLocalTypingEntry = req.localTypingEntries[0];
    res.set({
      'X-TypeScript-Types': `${origin}/${packageName}@${packageVersion}${topPriorityLocalTypingEntry}`
    });
    next();
    return;
  }

  const typesPackageName = getTypesPackageName(packageName);
  const { major, minor } = semver.parse(packageVersion);
  const typesPackageVersion = `${major}.${minor}`;
  const { dir, name } = path.parse(filename);
  const filenameSansExtension = path.join(dir, name);
  const typesPackageURL = `${origin}/${typesPackageName}@${typesPackageVersion}${filenameSansExtension}.d.ts`;
  try {
    const resolvedTypesUrl = await resolveTypesUrl(typesPackageURL, req.log);

    if (resolvedTypesUrl) {
      res.set({
        'X-TypeScript-Types': resolvedTypesUrl
      });
      next();
      return;
    }
  } catch (err) {
    req.log.debug(err.message);
  }

  next();
}
