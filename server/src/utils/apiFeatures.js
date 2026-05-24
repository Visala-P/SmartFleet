const buildPagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildSort = (sortBy = "createdAt", order = "desc") => ({
  [sortBy]: order === "asc" ? 1 : -1,
});

module.exports = { buildPagination, buildSort };
