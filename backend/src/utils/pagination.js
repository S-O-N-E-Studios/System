const paginate = (query = {}, defaults = { page: 1, limit: 20 }) => {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaults.limit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

module.exports = { paginate };
