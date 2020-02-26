import createSearch from './createSearch.js';
import { typesOrigin } from '../config';

export default function createPackageURL(
  packageName,
  packageVersion,
  filename,
  query
) {
  let url = `/${packageName}`;

  if (packageVersion) url += `@${packageVersion}`;
  if (filename) url += filename;
  if (query) {
    if (query.types != null && typesOrigin) {
      delete query.types;
      url = typesOrigin + url;
    }
    url += createSearch(query);
  }

  return url;
}
