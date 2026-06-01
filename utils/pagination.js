const DEFAULT_MAX_LIMIT = 500;

function parsePositiveInteger(value) {
  if (Array.isArray(value)) {
    return parsePositiveInteger(value[0]);
  }

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "string" && !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parsePagination(query, options = {}) {
  const defaultLimit = options.defaultLimit ?? 100;
  const maxLimit = options.maxLimit ?? DEFAULT_MAX_LIMIT;
  const requestedLimit = parsePositiveInteger(query.limit);
  const requestedOffset = parsePositiveInteger(query.offset);
  const limit = Math.min(requestedLimit ?? defaultLimit, maxLimit);
  const offset = requestedOffset ?? 0;

  return {
    limit,
    offset,
  };
}

export function setPaginationHeaders(response, { limit, offset, count }) {
  response.setHeader("X-Pagination-Limit", String(limit));
  response.setHeader("X-Pagination-Offset", String(offset));
  response.setHeader("X-Pagination-Returned", String(count));
}
